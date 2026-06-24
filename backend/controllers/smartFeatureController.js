const { Product, Category } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment-timezone');

exports.getExpiringProducts = async (req, res) => {
    try {
        const ownerId = req.user.store_id || req.user.id || req.user.user_id;
        
        if (!ownerId) {
            console.error('CRITICAL ERROR: ownerId is undefined! req.user payload:', req.user);
            return res.status(401).json({ message: "Sesi Anda bermasalah (ID Toko tidak ditemukan). Silakan logout dan login kembali." });
        }

        // Mendapatkan tanggal hari ini dan 30 hari ke depan
        const today = moment().tz('Asia/Jakarta').startOf('day').format('YYYY-MM-DD');
        const next30Days = moment().tz('Asia/Jakarta').add(30, 'days').endOf('day').format('YYYY-MM-DD');

        const expiringProducts = await Product.findAll({
            where: {
                user_id_fk: ownerId,
                product_stock: { [Op.gt]: 0 }, // Hanya produk yang masih ada stok
                expired_date: {
                    [Op.not]: null,
                    [Op.lte]: next30Days
                }
            },
            include: [{
                model: Category,
                attributes: ['category_name']
            }],
            order: [['expired_date', 'ASC']]
        });

        // Tambahkan atribut sisa hari untuk mempermudah frontend
        const expiring_soon = [];
        const already_expired = [];
        let total_spoilage_loss = 0;

        expiringProducts.forEach(product => {
            const data = product.toJSON();
            // Timezone Drift Fix: Gunakan perbandingan murni YYYY-MM-DD
            const expiredDateMoment = moment.tz(data.expired_date, 'Asia/Jakarta').startOf('day');
            const todayMoment = moment.tz(today, 'YYYY-MM-DD', 'Asia/Jakarta').startOf('day');
            
            const daysLeft = expiredDateMoment.diff(todayMoment, 'days');
            data.days_left = daysLeft;

            if (daysLeft < 0) {
                already_expired.push(data);
                total_spoilage_loss += (data.product_cost * data.product_stock);
            } else {
                expiring_soon.push(data);
            }
        });

        res.status(200).json({
            expiring_soon,
            already_expired,
            total_spoilage_loss
        });
    } catch (error) {
        console.error("Error fetching expiring products:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server saat mengambil data kedaluwarsa." });
    }
};

exports.writeOffExpiredStock = async (req, res) => {
    try {
        const { product_id } = req.body;
        const ownerId = req.user.store_id;

        const product = await Product.findOne({
            where: { product_id, user_id_fk: ownerId }
        });

        if (!product) {
            return res.status(404).json({ message: "Produk tidak ditemukan." });
        }

        if (product.product_stock <= 0) {
            return res.status(400).json({ message: "Stok produk sudah kosong." });
        }

        const quantity = product.product_stock;
        const spoilage_loss = quantity * product.product_cost;

        // Load model InventoryLog using sequelize
        const { InventoryLog } = require('../models');

        await InventoryLog.create({
            user_id_fk: ownerId,
            product_id_fk: product.product_id,
            action: 'WRITE_OFF_EXPIRED',
            quantity: quantity,
            spoilage_loss: spoilage_loss,
            notes: 'Pemusnahan stok kedaluwarsa secara otomatis via sistem'
        });

        product.product_stock = 0;
        product.expired_date = null;
        await product.save();

        res.status(200).json({ 
            message: "Stok basi berhasil dimusnahkan dan dicatat ke log audit.",
            spoilage_loss 
        });
    } catch (error) {
        console.error("Error writing off expired stock:", error);
        res.status(500).json({ message: "Gagal memusnahkan stok kedaluwarsa." });
    }
};

exports.applyMarkdown = async (req, res) => {
    try {
        if (req.user.role !== 'owner') {
            return res.status(403).json({ message: "Akses ditolak. Hanya owner yang dapat mengubah harga produk." });
        }

        const ownerId = req.user.store_id;
        const { product_id, new_price } = req.body;

        if (!product_id || new_price === undefined || new_price < 0) {
            return res.status(400).json({ message: "Data tidak lengkap atau harga tidak valid." });
        }

        const product = await Product.findOne({
            where: {
                product_id: product_id,
                user_id_fk: ownerId
            }
        });

        if (!product) {
            return res.status(404).json({ message: "Produk tidak ditemukan." });
        }

        // Simpan harga asli sebelum di-markdown jika belum ada kolom khusus? (Untuk MVP, kita replace langsung sesuai instruksi)
        // Harga baru langsung diupdate
        await product.update({ product_price: new_price });

        res.status(200).json({ 
            message: "Harga jual produk berhasil diperbarui (Markdown applied).", 
            product 
        });
    } catch (error) {
        console.error("Error applying markdown:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server saat mengaplikasikan diskon." });
    }
};

exports.getAnomalies = async (req, res) => {
    try {
        const ownerId = req.user.store_id || req.user.id || req.user.user_id;
        
        if (!ownerId) {
            return res.status(401).json({ message: "Sesi Anda bermasalah (ID Toko tidak ditemukan)." });
        }
        
        const { AnomalyTicket, Transaction, TransactionDetail, User, Product } = require('../models');
        const moment = require('moment-timezone');

        // Mengambil semua tiket anomali (termasuk DISMISSED untuk Riwayat Audit)
        const tickets = await AnomalyTicket.findAll({
            where: {
                user_id_fk: ownerId,
                status: ['OPEN', 'RESOLVED', 'DISMISSED']
            },
            limit: 50,
            include: [
                {
                    model: Transaction,
                    as: 'TransactionRef',
                    include: [
                        { model: User, as: 'Cashier', attributes: ['username'] },
                        { model: TransactionDetail, include: [{ model: Product, attributes: ['product_name'] }] }
                    ]
                },
                {
                    model: TransactionDetail,
                    as: 'DetailRef',
                    include: [
                        { model: Product, attributes: ['product_name'] },
                        { model: Transaction, include: [{ model: User, as: 'Cashier', attributes: ['username'] }] }
                    ]
                },
                {
                    model: User,
                    as: 'Resolver',
                    attributes: ['username']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        const timeAnomalies = [];
        const priceAnomalies = [];

        tickets.forEach(ticket => {
            if (ticket.anomaly_type === 'TIME' && ticket.TransactionRef) {
                const trx = ticket.TransactionRef;
                const products = trx.TransactionDetails ? trx.TransactionDetails.map(d => `${d.Product ? d.Product.product_name : 'Produk Dihapus'} (x${d.quantity})`).join(', ') : '';
                timeAnomalies.push({
                    ticket_id: ticket.ticket_id,
                    transaction_id: trx.transaction_id,
                    datetime: trx.transaction_datetime,
                    total_amount: trx.total_amount,
                    products: products,
                    cashier: trx.Cashier ? trx.Cashier.username : 'Unknown',
                    time: moment(trx.transaction_datetime).tz('Asia/Jakarta').format('HH:mm:ss'),
                    reason: ticket.description,
                    status: ticket.status,
                    resolution_note: ticket.resolution_note,
                    resolved_at: ticket.resolved_at,
                    resolved_by: ticket.Resolver ? ticket.Resolver.username : null
                });
            } else if (ticket.anomaly_type === 'PRICE' && ticket.DetailRef) {
                const detail = ticket.DetailRef;
                const trx = detail.Transaction;
                const margin = detail.selling_price - detail.capital_cost;
                const marginPercentage = (margin / detail.capital_cost) * 100;

                priceAnomalies.push({
                    ticket_id: ticket.ticket_id,
                    transaction_id: trx ? trx.transaction_id : null,
                    datetime: trx ? trx.transaction_datetime : null,
                    cashier: (trx && trx.Cashier) ? trx.Cashier.username : 'Unknown',
                    product: detail.Product ? detail.Product.product_name : 'Produk Dihapus',
                    quantity: detail.quantity,
                    capital_cost: detail.capital_cost,
                    selling_price: detail.selling_price,
                    margin_percentage: marginPercentage.toFixed(2),
                    reason: ticket.description,
                    status: ticket.status,
                    resolution_note: ticket.resolution_note,
                    resolved_at: ticket.resolved_at,
                    resolved_by: ticket.Resolver ? ticket.Resolver.username : null
                });
            }
        });

        res.status(200).json({ timeAnomalies, priceAnomalies });
    } catch (error) {
        console.error("Error fetching anomalies:", error);
        res.status(500).json({ message: "Gagal mengambil data anomali." });
    }
};

exports.resolveAnomaly = async (req, res) => {
    try {
        const ownerId = req.user.store_id || req.user.id || req.user.user_id;
        const resolverId = req.user.id || req.user.user_id; // id user yang sedang login
        const { ticket_id, status, resolution_note } = req.body;

        if (!ownerId) {
            return res.status(401).json({ message: "Sesi Anda bermasalah (ID Toko tidak ditemukan)." });
        }

        if (!ticket_id || !status || !['RESOLVED', 'DISMISSED'].includes(status)) {
            return res.status(400).json({ message: "Data tidak valid atau status tidak dikenali." });
        }

        const { AnomalyTicket } = require('../models');

        const ticket = await AnomalyTicket.findOne({
            where: { ticket_id: ticket_id, user_id_fk: ownerId }
        });

        if (!ticket) {
            return res.status(404).json({ message: "Tiket anomali tidak ditemukan." });
        }

        if (ticket.status !== 'OPEN') {
            return res.status(400).json({ message: "Tiket anomali sudah ditutup." });
        }

        await ticket.update({
            status: status,
            resolution_note: resolution_note || null,
            resolved_at: new Date(),
            resolved_by: resolverId
        });

        res.status(200).json({ message: "Kasus anomali berhasil ditutup.", ticket });
    } catch (error) {
        console.error("Error resolving anomaly:", error);
        res.status(500).json({ message: "Gagal memproses penyelesaian anomali." });
    }
};
