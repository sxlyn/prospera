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
        const enrichedProducts = expiringProducts.map(product => {
            const data = product.toJSON();
            const daysLeft = moment(data.expired_date).diff(moment(today), 'days');
            data.days_left = daysLeft;
            return data;
        });

        res.status(200).json(enrichedProducts);
    } catch (error) {
        console.error("Error fetching expiring products:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server saat mengambil data kedaluwarsa." });
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
            console.error('CRITICAL ERROR: ownerId is undefined! req.user payload:', req.user);
            return res.status(401).json({ message: "Sesi Anda bermasalah (ID Toko tidak ditemukan). Silakan logout dan login kembali." });
        }
        
        const { StoreSettings, Transaction, TransactionDetail, User, Product } = require('../models');

        const settings = await StoreSettings.findOne({ where: { user_id_fk: ownerId } });
        const thirtyDaysAgo = moment().subtract(30, 'days').toDate();
        
        const transactions = await Transaction.findAll({
            where: {
                user_id_fk: ownerId,
                transaction_datetime: { [Op.gte]: thirtyDaysAgo }
            },
            include: [
                {
                    model: TransactionDetail,
                    include: [{ model: Product, attributes: ['product_name'] }]
                },
                {
                    model: User,
                    as: 'Cashier',
                    attributes: ['username', 'role']
                }
            ],
            order: [['transaction_datetime', 'DESC']]
        });

        const timeAnomalies = [];
        const priceAnomalies = [];

        transactions.forEach(trx => {
            // Anomali Waktu (Jika settings ada & kasir yang melakukan)
            if (settings && trx.Cashier && trx.Cashier.role !== 'owner') {
                const trxTime = moment(trx.transaction_datetime).tz('Asia/Jakarta').format('HH:mm:ss');
                const openHour = settings.open_hour;
                const closeMoment = moment.tz(`1970-01-01 ${settings.close_hour}`, 'YYYY-MM-DD HH:mm:ss', 'Asia/Jakarta');
                closeMoment.add(settings.grace_period_minutes, 'minutes');
                const closeHourWithGrace = closeMoment.format('HH:mm:ss');

                let isOutsideHours = false;
                if (openHour <= closeHourWithGrace) {
                    isOutsideHours = trxTime < openHour || trxTime > closeHourWithGrace;
                } else {
                    isOutsideHours = trxTime < openHour && trxTime > closeHourWithGrace;
                }

                if (isOutsideHours) {
                    timeAnomalies.push({
                        transaction_id: trx.transaction_id,
                        datetime: trx.transaction_datetime,
                        cashier: trx.Cashier ? trx.Cashier.username : 'Unknown',
                        time: trxTime,
                        reason: `Di luar jam operasional (${openHour} - ${closeHourWithGrace})`
                    });
                }
            }

            // Anomali Harga (Margin <= 2%)
            trx.TransactionDetails.forEach(detail => {
                if (detail.transaction_type === 'sell' && detail.capital_cost > 0) {
                    const margin = detail.selling_price - detail.capital_cost;
                    const marginPercentage = (margin / detail.capital_cost) * 100;
                    
                    if (marginPercentage <= 2) {
                        priceAnomalies.push({
                            transaction_id: trx.transaction_id,
                            datetime: trx.transaction_datetime,
                            cashier: trx.Cashier ? trx.Cashier.username : 'Unknown',
                            product: detail.Product ? detail.Product.product_name : 'Produk Dihapus',
                            capital_cost: detail.capital_cost,
                            selling_price: detail.selling_price,
                            margin_percentage: marginPercentage.toFixed(2),
                            reason: `Margin sangat tipis atau jual rugi (${marginPercentage.toFixed(2)}%)`
                        });
                    }
                }
            });
        });

        res.status(200).json({ timeAnomalies, priceAnomalies });
    } catch (error) {
        console.error("Error fetching anomalies:", error);
        res.status(500).json({ message: "Gagal mengambil data anomali." });
    }
};
