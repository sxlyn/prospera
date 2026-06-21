const { sequelize, Transaction, TransactionDetail, Product, Category, User } = require('../models');
const { Op } = require('sequelize'); 
const ExcelJS = require('exceljs');

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

        await TransactionDetail.bulkCreate(detailRecords, { 
            transaction: t, 
            individualHooks: true 
        });

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

// 3. Fungsi untuk export laporan transaksi ke Excel
const exportTransactionHistory = async (req, res, next) => {
    try {
        const userId = req.user.store_id;
        const { start, end } = req.query;
        let whereCondition = { user_id_fk: userId };

        if (start && end) {
            whereCondition.transaction_datetime = {
                [Op.between]: [`${start} 00:00:00`, `${end} 23:59:59`]
            };
        }

        const transactions = await Transaction.findAll({
            where: whereCondition,
            order: [['transaction_datetime', 'ASC']],
            include: [
                {
                    model: TransactionDetail,
                    include: [
                        {
                            model: Product,
                            attributes: ['product_name'],
                            paranoid: false,
                            include: [Category]
                        }
                    ]
                },
                {
                    model: User,
                    as: 'Cashier',
                    attributes: ['user_id', 'username']
                }
            ]
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Laporan Transaksi');

        worksheet.columns = [
            { header: 'ID Transaksi', key: 'transaction_id', width: 15 },
            { header: 'Tanggal & Waktu', key: 'datetime', width: 25 },
            { header: 'Tipe Transaksi', key: 'type', width: 15 },
            { header: 'Nama Kasir', key: 'cashier', width: 20 },
            { header: 'Status Transaksi', key: 'status', width: 18 },
            { header: 'Metode Pembayaran', key: 'payment_method', width: 20 },
            { header: 'Nama Produk', key: 'product_name', width: 30 },
            { header: 'Kategori', key: 'category', width: 20 },
            { header: 'Harga Modal', key: 'capital_cost', width: 15 },
            { header: 'Harga Jual', key: 'selling_price', width: 15 },
            { header: 'Qty Terjual', key: 'quantity', width: 12 },
            { header: 'Subtotal Harga', key: 'sub_total', width: 18 },
            { header: 'Total Laba Nominal', key: 'total_laba', width: 20 },
            { header: 'Margin Keuntungan', key: 'margin', width: 18 }
        ];

        // Styling Header
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        transactions.forEach((tx) => {
            const dateStr = tx.transaction_datetime ? new Date(tx.transaction_datetime).toLocaleString('id-ID') : '-';
            const typeStr = tx.transaction_type === 'sell' ? 'Penjualan' : 'Restock';
            const statusStr = tx.status === 'success' ? 'Sukses' : (tx.status === 'cancelled' ? 'Dibatalkan' : tx.status);
            const cashierName = tx.Cashier ? tx.Cashier.username : 'Sistem';
            const paymentMethod = 'Tunai';

            tx.TransactionDetails.forEach((detail) => {
                const productName = detail.Product ? detail.Product.product_name : 'Produk Dihapus';
                const categoryName = (detail.Product && detail.Product.Category) ? detail.Product.Category.category_name : '-';
                
                let totalLaba = 0;
                let marginStr = '-';
                if (tx.transaction_type === 'sell' && tx.status === 'success') {
                    totalLaba = (detail.selling_price - detail.capital_cost) * detail.quantity;
                    const margin = ((detail.selling_price - detail.capital_cost) / detail.capital_cost) * 100;
                    marginStr = isFinite(margin) ? `${margin.toFixed(2)}%` : '0%';
                }

                worksheet.addRow({
                    transaction_id: `#TRX-${tx.transaction_id}`,
                    datetime: dateStr,
                    type: typeStr,
                    cashier: cashierName,
                    status: statusStr,
                    payment_method: paymentMethod,
                    product_name: productName,
                    category: categoryName,
                    capital_cost: detail.capital_cost,
                    selling_price: detail.selling_price,
                    quantity: detail.quantity,
                    sub_total: detail.sub_total,
                    total_laba: totalLaba,
                    margin: marginStr
                });
            });
        });

        const currencyFormat = '"Rp"#,##0;[Red]\\-"Rp"#,##0';
        ['I', 'J', 'L', 'M'].forEach(col => {
            worksheet.getColumn(col).numFmt = currencyFormat;
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=' + `Laporan_Transaksi_${start || 'All'}_to_${end || 'All'}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Export Error:", error);
        next(error);
    }
};

// 4. Fungsi untuk rekap ringkasan transaksi
const getTransactionSummary = async (req, res, next) => {
    try {
        const userId = req.user.store_id;
        const { start, end } = req.query;
        let whereCondition = { user_id_fk: userId };

        if (start && end) {
            whereCondition.transaction_datetime = {
                [Op.between]: [`${start} 00:00:00`, `${end} 23:59:59`]
            };
        }

        const transactions = await Transaction.findAll({
            where: whereCondition,
            include: [{
                model: TransactionDetail,
            }]
        });

        let totalTransactions = transactions.length;
        let totalIncome = 0;
        let totalProfit = 0;
        let totalRestock = 0;

        transactions.forEach(tx => {
            if (tx.status === 'success') {
                if (tx.transaction_type === 'sell') {
                    tx.TransactionDetails.forEach(detail => {
                        totalIncome += detail.sub_total;
                        totalProfit += (detail.selling_price - detail.capital_cost) * detail.quantity;
                    });
                } else if (tx.transaction_type === 'buy') {
                    tx.TransactionDetails.forEach(detail => {
                        totalRestock += detail.sub_total;
                    });
                }
            }
        });

        res.status(200).json({
            totalTransactions,
            totalIncome,
            totalProfit,
            totalRestock
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { createTransaction, getTransactionHistory, exportTransactionHistory, getTransactionSummary };