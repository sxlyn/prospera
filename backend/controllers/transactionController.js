const { sequelize, Transaction, TransactionDetail, Product, Category } = require('../models');
const { Op } = require('sequelize'); 

// 1. Fungsi untuk melakukan proses pembayaran (Dilengkapi Sistem Rollback)
const createTransaction = async (req, res, next) => {
    const userId = req.user.store_id; 
    const { transaction_type = null, items } = req.body; 

    // SECURITY FIX (B-T07): Waktu transaksi dikontrol SERVER, bukan client
    // Sebelumnya: transaction_datetime diambil dari req.body — rentan backdating/future-dating
    // Sekarang: server menentukan timestamp saat transaksi diproses
    const serverDatetime = new Date();

    // Membuka koneksi khusus untuk sistem pengamanan transaksi (Rollback)
    const t = await sequelize.transaction();

    try {
        let total_amount = 0;
        let validItems = [];

        // Tahap 1: Memeriksa ketersediaan stok produk dan menghitung total harga
        for (let item of items) {
            const product = await Product.findOne({
                where: { 
                    product_id: item.product_id, 
                    user_id_fk: userId 
                },
                transaction: t,
                lock: t.LOCK.UPDATE
            });
            
            if (!product) {
                throw new Error(`Produk dengan ID ${item.product_id} tidak ditemukan.`);
            }

            const itemTransactionType = item.transaction_type || transaction_type || 'sell';

            // Validasi stok untuk penjualan
            if (itemTransactionType === 'sell' && product.product_stock < item.quantity) {
                throw new Error(`Stok ${product.product_name} tidak mencukupi. Sisa stok: ${product.product_stock}`);
            }

            const capital_cost = item.capital_cost ?? product.product_cost;
            const selling_price = item.selling_price ?? product.product_price;

            // FIX: Kalkulasi sub_total berdasarkan tipe transaksi
            // Penjualan (sell): sub_total = harga jual × kuantitas
            // Pembelian (buy):  sub_total = harga modal × kuantitas
            const sub_total = itemTransactionType === 'buy' 
                ? capital_cost * item.quantity 
                : selling_price * item.quantity;
            
            total_amount += sub_total;

            validItems.push({
                product_id: product.product_id,
                quantity: item.quantity,
                capital_cost: capital_cost,
                selling_price: selling_price,
                sub_total: sub_total,
                transaction_type: itemTransactionType
            });
        }

        // Tahap 2: Tentukan tipe transaksi header
        // FIX: Jika ada campuran tipe transaksi dalam satu checkout, tolak transaksi
        const itemTypes = [...new Set(validItems.map(item => item.transaction_type))];
        if (itemTypes.length > 1) {
            throw new Error('Tidak dapat mencampur tipe transaksi (buy & sell) dalam satu checkout. Pisahkan menjadi transaksi terpisah.');
        }
        const headerTransactionType = itemTypes[0];

        // Tahap 3: Membuat pencatatan struk utama di tabel Transactions
        const newTransaction = await Transaction.create(
            {
                user_id_fk: userId, // Ini adalah ID toko (tenant SaaS)
                cashier_id: req.user.id || req.user.user_id, // Ini adalah ID kasir yang sebenarnya melakukan transaksi
                total_amount: total_amount,
                transaction_type: headerTransactionType,
                transaction_datetime: serverDatetime  // SECURITY: Timestamp dikontrol server
            },
            { transaction: t }
        );

        // Tahap 4: Batch-insert rincian barang (PERFORMANCE FIX B-S09: mengganti N create → 1 bulkCreate)
        const detailRecords = validItems.map(vItem => ({
            transaction_id_fk: newTransaction.transaction_id,
            product_id_fk: vItem.product_id,
            quantity: vItem.quantity,
            capital_cost: vItem.capital_cost,
            selling_price: vItem.selling_price,
            sub_total: vItem.sub_total,
            transaction_type: vItem.transaction_type
        }));

        await TransactionDetail.bulkCreate(detailRecords, { transaction: t });

        // Tahap 5: Update stok produk (tetap per-item karena row-level lock diperlukan)
        // PERFORMANCE FIX (B-S10): Menggunakan Promise.all untuk paralelisasi
        await Promise.all(validItems.map(vItem => {
            if (vItem.transaction_type === 'sell') {
                return Product.decrement('product_stock', {
                    by: vItem.quantity,
                    where: { product_id: vItem.product_id },
                    transaction: t
                });
            } else {
                return Product.increment('product_stock', {
                    by: vItem.quantity,
                    where: { product_id: vItem.product_id },
                    transaction: t
                });
            }
        }));

        // Menyimpan seluruh perubahan secara permanen ke basis data jika tidak ada kesalahan
        await t.commit();

        res.status(201).json({ 
            message: "Transaksi berhasil diproses!", 
            transaction_id: newTransaction.transaction_id,
            total_belanja: total_amount
        });

    } catch (error) {
        await t.rollback();
        console.error("Transaksi Gagal, Rollback dilakukan:", error.message);
        
        // Error bisnis yang dikenali (produk tidak ditemukan, stok kurang, dll)
        if (error.message.includes("tidak ditemukan") || 
            error.message.includes("tidak mencukupi") ||
            error.message.includes("Tidak dapat mencampur")) {
            return res.status(400).json({ message: error.message });
        }
        
        next(error);
    }
};

// 2. Fungsi untuk mengambil riwayat transaksi toko
const getTransactionHistory = async (req, res, next) => {
    try {
        const userId = req.user.store_id;
        
        const { start, end } = req.query;
        let whereCondition = { user_id_fk: userId };

        // Default page 1, default limit 1000 untuk backward compatibility
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 1000;
        const offset = (page - 1) * limit;

        // Filter berdasarkan kolom transaction_datetime
        if (start && end) {
            whereCondition.transaction_datetime = {
                [Op.between]: [`${start} 00:00:00`, `${end} 23:59:59`]
            };
        }
        
        // Mengambil seluruh data riwayat dengan Eager Loading dan urut berdasarkan ID (DESC)
        const { count, rows } = await Transaction.findAndCountAll({
            where: whereCondition, 
            limit: limit,
            offset: offset,
            order: [['transaction_id', 'DESC']],
            include: [
                {
                    model: TransactionDetail,
                    include: [
                        {
                            model: Product,
                            attributes: ['product_name'],
                            paranoid: false, // Pastikan produk yang sudah di-soft-delete tetap muncul di riwayat transaksi
                            include: [Category]
                        }
                    ]
                }
            ],
            distinct: true // Penting karena ada join dengan tabel lain agar count akurat berdasarkan header transaction
        });
        
        res.status(200).json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            transactions: rows
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { createTransaction, getTransactionHistory };