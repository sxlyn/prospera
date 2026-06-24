const { sequelize, Transaction, TransactionDetail, Product, Category, User, StoreSettings } = require('../models');
const { Op } = require('sequelize'); 
const ExcelJS = require('exceljs');
const bcrypt = require('bcryptjs');

// FIX (CRITICAL-03): Idempotency Key Store — Cegah transaksi duplikat
// (misal: double-click tombol, retry jaringan, form re-submit)
// Menggunakan in-memory Map + TTL cleanup (tanpa Redis) — cocok untuk
// single-process Node.js POS. Jika scale-out multi-proses, migrasi ke Redis.
const idempotencyStore = new Map(); // key => { processedAt: timestamp }
const IDEMPOTENCY_TTL_MS = 5 * 60 * 1000; // 5 menit

// Cleanup otomatis setiap 10 menit — cegah memory leak
const idempotencyCleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, val] of idempotencyStore.entries()) {
        if (now - val.processedAt > IDEMPOTENCY_TTL_MS) {
            idempotencyStore.delete(key);
        }
    }
}, 10 * 60 * 1000);
// Pastikan interval tidak memblokir proses keluar secara graceful
if (idempotencyCleanup.unref) idempotencyCleanup.unref();

const createTransaction = async (req, res, next) => {
    const userId = req.user.store_id; 
    const { transaction_type = null, items } = req.body; 

    // SECURITY FIX (B-T07): Waktu transaksi dikontrol SERVER, bukan client
    const serverDatetime = new Date();

    // FIX (CRITICAL-03): Idempotency check — tolak request duplikat
    // Frontend menyertakan header X-Idempotency-Key (UUID v4) per checkout attempt.
    // Ini mencegah double-click, retry jaringan, atau form re-submit membuat 2 transaksi.
    const idempotencyKey = req.headers['x-idempotency-key'];
    if (idempotencyKey) {
        // Isolasi per-user: key = userId::idempotencyKey (cegah collision antar toko)
        const storeKey = `${userId}::${idempotencyKey}`;
        if (idempotencyStore.has(storeKey)) {
            return res.status(409).json({
                message: 'Transaksi duplikat terdeteksi. Request ini sudah pernah diproses. Silakan muat ulang halaman jika ini bukan pengulangan yang disengaja.',
                isDuplicate: true
            });
        }
        // Tandai key sebagai sudah diproses (dihapus otomatis setelah 5 menit oleh cleanup)
        idempotencyStore.set(storeKey, { processedAt: Date.now() });
    }

    // ENTERPRISE FIX: Payload Array Bomber Protection
    if (!items || items.length === 0) {
        return res.status(400).json({ message: "Keranjang kosong." });
    }
    if (items.length > 100) {
        return res.status(400).json({ message: "Keranjang maksimal 100 jenis barang per transaksi. Silakan pecah transaksi." });
    }

    // ENTERPRISE FIX: Fat-Finger Validation di API
    for (let item of items) {
        if (!item.quantity || item.quantity <= 0 || item.quantity > 1000) {
            return res.status(400).json({ message: "Kuantitas barang tidak valid (maksimal 1000 unit)." });
        }
    }


    // Membuka koneksi khusus untuk sistem pengamanan transaksi (Rollback)
    const t = await sequelize.transaction();

    try {
        let total_amount = 0;
        let cart_minimum_allowed = 0; 
        let validItems = [];

        // ENTERPRISE FIX: Bulk Fetching & Deadlock Prevention
        const uniqueProductIds = [...new Set(items.map(item => item.product_id))].sort((a, b) => a - b);
        
        const products = await Product.findAll({
            where: { 
                product_id: { [Op.in]: uniqueProductIds },
                user_id_fk: userId 
            },
            order: [['product_id', 'ASC']],
            transaction: t,
            lock: t.LOCK.UPDATE
        });

        // ENTERPRISE FIX: Mismatch Length Check (Barang Gaib)
        if (products.length !== uniqueProductIds.length) {
            throw new Error("Terdapat produk yang tidak valid atau baru saja dihapus oleh Manajer. Silakan muat ulang halaman.");
        }

        const productMap = {};
        for (const p of products) {
            productMap[p.product_id] = p;
        }

        // Tahap 1: Memeriksa ketersediaan stok produk dan menghitung total harga
        for (let item of items) {
            const product = productMap[item.product_id];
            
            const itemTransactionType = item.transaction_type || transaction_type || 'sell';

            // Validasi stok untuk penjualan
            if (itemTransactionType === 'sell' && product.product_stock < item.quantity) {
                throw new Error(`Stok ${product.product_name} tidak mencukupi. Sisa stok: ${product.product_stock}`);
            }

            // ENTERPRISE FIX: Zero-Trust Architecture (Harga mutlak dari Database)
            const capital_cost = product.product_cost;
            const selling_price = product.product_price;

            // Kalkulasi sub_total berdasarkan tipe transaksi
            const sub_total = itemTransactionType === 'buy' 
                ? capital_cost * item.quantity 
                : selling_price * item.quantity;
            
            total_amount += sub_total;

            const minimum_allowed_price = Math.min(capital_cost, product.product_price);
            cart_minimum_allowed += (minimum_allowed_price * item.quantity);

            if (itemTransactionType === 'sell' && req.user.role === 'karyawan') {
                if (selling_price < minimum_allowed_price) {
                    throw new Error(`Otorisasi Diperlukan: Harga jual item '${product.product_name}' berada di bawah batas wajar.`);
                }
            }

            validItems.push({
                product_id: product.product_id,
                quantity: item.quantity,
                capital_cost: capital_cost,
                selling_price: selling_price,
                sub_total: sub_total,
                transaction_type: itemTransactionType,
                current_stock: product.product_stock
            });
        }

        // Tahap 2: Tentukan tipe transaksi header
        // FIX: Jika ada campuran tipe transaksi dalam satu checkout, tolak transaksi
        const itemTypes = [...new Set(validItems.map(item => item.transaction_type))];
        if (itemTypes.length > 1) {
            throw new Error('Tidak dapat mencampur tipe transaksi (buy & sell) dalam satu checkout. Pisahkan menjadi transaksi terpisah.');
        }
        const headerTransactionType = itemTypes[0];

        // ENTERPRISE FIX: Dynamic Cart Floor (Lapis 2)
        if (headerTransactionType === 'sell' && req.user.role === 'karyawan') {
            if (total_amount < cart_minimum_allowed) {
                throw new Error("Otorisasi Diperlukan: Total akhir nota berada di bawah batas modal keranjang. Hubungi Manajer.");
            }
        }

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
        await Promise.all(validItems.map(async (vItem) => {
            if (vItem.transaction_type === 'sell') {
                if (vItem.current_stock - vItem.quantity === 0) {
                    return Product.update({
                        product_stock: 0,
                        expired_date: null
                    }, {
                        where: { product_id: vItem.product_id },
                        transaction: t
                    });
                } else {
                    return Product.decrement('product_stock', {
                        by: vItem.quantity,
                        where: { product_id: vItem.product_id },
                        transaction: t
                    });
                }
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

        // FIX (HIGH-03): Hardcap limit untuk mencegah memory bomb.
        // Frontend sudah kirim limit=10 (historyLimit). Cap ini adalah safety net
        // untuk mencegah abuse via curl/Postman dengan limit=999999.
        const MAX_LIMIT = 100;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 50, MAX_LIMIT);
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
// FIX (CRIT-02 + MED-04): Tambahkan 3 lapis proteksi Memory Bomb:
// 1. Default range 30 hari terakhir jika tidak ada parameter tanggal
// 2. Validasi maksimum range 366 hari (1 tahun fiskal)
// 3. Hard cap 10.000 transaksi header — tolak dengan HTTP 413 jika melebihi
const exportTransactionHistory = async (req, res, next) => {
    try {
        const userId = req.user.store_id;
        let { start, end } = req.query;

        // FIX (MED-04): Default ke 30 hari terakhir jika tidak ada parameter tanggal
        if (!start || !end) {
            const today = new Date();
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);
            end   = today.toISOString().split('T')[0];
            start = thirtyDaysAgo.toISOString().split('T')[0];
        }

        // FIX (CRIT-02): Validasi format dan rentang tanggal maksimum 366 hari
        const startDate = new Date(start);
        const endDate   = new Date(end);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({ message: 'Format tanggal tidak valid. Gunakan format YYYY-MM-DD.' });
        }
        if (endDate < startDate) {
            return res.status(400).json({ message: 'Tanggal akhir tidak boleh lebih awal dari tanggal mulai.' });
        }
        const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        if (diffDays > 366) {
            return res.status(400).json({
                message: `Rentang tanggal terlalu besar (${diffDays} hari). Maksimum export adalah 366 hari. Silakan pecah menjadi beberapa periode.`
            });
        }

        const whereCondition = {
            user_id_fk: userId,
            transaction_datetime: {
                [Op.between]: [`${start} 00:00:00`, `${end} 23:59:59`]
            }
        };

        // FIX (CRIT-02): Hard cap — COUNT dulu (1 query murah) sebelum fetch data besar
        const EXPORT_ROW_HARD_CAP = 10_000;
        const transactionCount = await Transaction.count({ where: whereCondition });
        if (transactionCount > EXPORT_ROW_HARD_CAP) {
            return res.status(413).json({
                message: `Data terlalu besar (${transactionCount.toLocaleString('id-ID')} transaksi). Maksimum ${EXPORT_ROW_HARD_CAP.toLocaleString('id-ID')} per export. Silakan perkecil rentang tanggal.`,
                totalFound: transactionCount,
                hardCap: EXPORT_ROW_HARD_CAP
            });
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
        // FIX (CRITICAL-07): Sanitasi parameter date sebelum dimasukkan ke header HTTP
        // untuk mencegah Header Injection Attack. Hanya izinkan karakter alfanumerik, dash, underscore.
        const sanitizeFilename = (s) => (s || 'All').replace(/[^a-zA-Z0-9\-_]/g, '');
        res.setHeader('Content-Disposition', `attachment; filename="Laporan_Transaksi_${sanitizeFilename(start)}_to_${sanitizeFilename(end)}.xlsx"`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Export Error:", error);
        next(error);
    }
};

// 4. Fungsi untuk rekap ringkasan transaksi
// FIX (CRIT-01): Ganti pola N+1 Query dengan 2 query SQL aggregation paralel.
// SEBELUM: findAll() semua transaksi + include detail → bisa N+1 query → loop di Node.js
// SESUDAH: 2x aggregation query paralel → MySQL engine yang menghitung → Node.js hanya parsing
// Untuk toko dengan 1000 transaksi: penghematan ~998 query dan ratusan MB RAM
const getTransactionSummary = async (req, res, next) => {
    try {
        const userId = req.user.store_id;
        const { start, end } = req.query;

        // Bangun filter tanggal yang konsisten dengan endpoint lain (Op.between)
        const dateFilter = {};
        if (start && end) {
            dateFilter.transaction_datetime = {
                [Op.between]: [`${start} 00:00:00`, `${end} 23:59:59`]
            };
        }

        // Query 1: Hitung total transaksi (semua tipe, semua status)
        // Query 2: Aggregasi finansial dari detail — hanya transaksi 'success'
        // Keduanya dijalankan PARALEL via Promise.all untuk efisiensi maksimum
        const [countResult, financialResult] = await Promise.all([
            // Q1: Count semua transaksi milik toko ini (termasuk pending/cancelled)
            Transaction.count({
                where: { user_id_fk: userId, ...dateFilter }
            }),

            // Q2: Satu agregasi besar — semua kalkulasi finansial dilakukan oleh MySQL
            // JOIN ke Transaction_details via include, filter hanya status='success'
            TransactionDetail.findAll({
                attributes: [
                    // Total omzet dari penjualan (sell)
                    [
                        literal(`SUM(CASE WHEN \`Transaction\`.\`transaction_type\` = 'sell' AND \`Transaction\`.\`status\` = 'success' THEN \`TransactionDetail\`.\`sub_total\` ELSE 0 END)`),
                        'totalIncome'
                    ],
                    // Total laba bersih dari penjualan (selling_price - capital_cost) * qty
                    [
                        literal(`SUM(CASE WHEN \`Transaction\`.\`transaction_type\` = 'sell' AND \`Transaction\`.\`status\` = 'success' THEN (\`TransactionDetail\`.\`selling_price\` - \`TransactionDetail\`.\`capital_cost\`) * \`TransactionDetail\`.\`quantity\` ELSE 0 END)`),
                        'totalProfit'
                    ],
                    // Total nilai restock (buy)
                    [
                        literal(`SUM(CASE WHEN \`Transaction\`.\`transaction_type\` = 'buy' AND \`Transaction\`.\`status\` = 'success' THEN \`TransactionDetail\`.\`sub_total\` ELSE 0 END)`),
                        'totalRestock'
                    ]
                ],
                include: [{
                    model: Transaction,
                    attributes: [], // Tidak perlu kolom Transaction di output — hanya untuk JOIN + filter
                    where: { user_id_fk: userId, ...dateFilter }
                }],
                raw: true
            })
        ]);

        // Parsing hasil agregasi — MySQL mengembalikan string untuk SUM, konversi ke Number
        const fin = financialResult[0] || {};
        const totalIncome  = parseFloat(fin.totalIncome)  || 0;
        const totalProfit  = parseFloat(fin.totalProfit)  || 0;
        const totalRestock = parseFloat(fin.totalRestock) || 0;

        res.status(200).json({
            totalTransactions: countResult,
            totalIncome,
            totalProfit,
            totalRestock
        });
    } catch (error) {
        next(error);
    }
};

// 5. Fungsi untuk membuka Sesi Lembur (Backend-Driven Grace Period)
const unlockOvertime = async (req, res, next) => {
    try {
        const { pin } = req.body;
        const ownerId = req.user.owner_id;

        if (!pin) {
            return res.status(400).json({ message: "PIN harus diisi." });
        }

        const settings = await StoreSettings.findOne({ where: { user_id_fk: ownerId } });
        if (!settings || !settings.emergency_pin) {
            return res.status(400).json({ message: "Toko ini tidak memiliki pengaturan PIN darurat." });
        }

        const isPinValid = await bcrypt.compare(pin, settings.emergency_pin);
        if (!isPinValid) {
            return res.status(401).json({ message: "PIN Darurat salah." });
        }

        // Anti-Clock Drift: Gunakan literal query MySQL untuk +1 Jam
        await sequelize.query(
            "UPDATE Users SET overtime_unlocked_until = CURRENT_TIMESTAMP + INTERVAL 1 HOUR WHERE user_id = ?",
            { replacements: [req.user.id], type: sequelize.QueryTypes.UPDATE }
        );

        res.json({ message: "Sesi lembur berhasil diaktifkan selama 1 jam." });
    } catch (err) {
        next(err);
    }
};

module.exports = { createTransaction, getTransactionHistory, exportTransactionHistory, getTransactionSummary, unlockOvertime };