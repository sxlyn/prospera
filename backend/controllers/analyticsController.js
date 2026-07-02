const { sequelize, Transaction, TransactionDetail, Product, InventoryLog } = require("../models");
const { Op, fn, col, literal } = require("sequelize");
const moment = require("moment-timezone"); // FIX (BUG-A05): Untuk prev-period date calculation yang timezone-safe
const { getDateFilter, buildWIBDateRange } = require("../utils/dateUtils");
const { getStatusBreakdown, getFinancialSummary, getProductBreakdown } = require("../services/analyticsService"); 

/**
 * SECURITY FIX (B-S15): Sanitasi parameter limit dari query string.
 * Menolak nilai negatif, nol, NaN, dan membatasi maksimum 100 untuk mencegah abuse.
 * @param {string|number} rawLimit - Nilai limit dari req.query
 * @param {number} defaultVal - Nilai default jika limit tidak valid (default: 5)
 * @returns {number} Limit yang aman
 */
const sanitizeLimit = (rawLimit, defaultVal = 5) => {
    const parsed = parseInt(rawLimit);
    if (!rawLimit || isNaN(parsed) || parsed <= 0) return defaultVal;
    return Math.min(parsed, 100); // Cap at 100 to prevent memory abuse
};

// 1. SUMMARY — REFACTOR (B-T14): Menggunakan shared analyticsService
const getSummary = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const userId = req.user.store_id;

        // Gunakan shared service (Single Source of Truth)
        const [statusBreakdown, financial, formattedDetails] = await Promise.all([
            getStatusBreakdown(startDate, endDate, userId),
            getFinancialSummary(startDate, endDate, userId),
            getProductBreakdown(startDate, endDate, userId)
        ]);

        const { success, total_transaction_all } = statusBreakdown;
        const { items_sold, revenue, total_profit, total_loss } = financial;
        const average_sale = success > 0 ? Math.round(revenue / success) : 0;

        // Revenue growth (logika unik untuk endpoint ini, tetap inline)
        let revenue_growth = "N/A";
        if (startDate && endDate) {
            // FIX (BUG-A05): Gunakan moment-timezone untuk kalkulasi periode sebelumnya.
            // SEBELUMNYA: new Date(startDate) + setDate() + toISOString().split('T')[0]
            //             — toISOString() mengembalikan UTC string, bisa off 1 hari jika
            //             server timezone berubah atau startDate datang dengan offset.
            // SESUDAH   : moment() untuk manipulasi tanggal yang timezone-safe dan konsisten.
            const momentStart = moment(startDate, 'YYYY-MM-DD');
            const momentEnd   = moment(endDate,   'YYYY-MM-DD');
            const diffDays = momentEnd.diff(momentStart, 'days') || 1;

            const prevEndDate   = momentStart.clone().subtract(1, 'days').format('YYYY-MM-DD');
            const prevStartDate = momentStart.clone().subtract(diffDays, 'days').format('YYYY-MM-DD');

            const prevFinancialData = await TransactionDetail.findAll({
                include: [{
                    model: Transaction,
                    attributes: [],
                    where: { ...getDateFilter(prevStartDate, prevEndDate), user_id_fk: userId, status: 'success' }
                }],
                where: { transaction_type: 'sell' },
                attributes: [[literal(`SUM(selling_price * quantity)`), 'prev_revenue']],
                raw: true
            });

            const prev_revenue = parseFloat(prevFinancialData[0]?.prev_revenue) || 0;

            if (prev_revenue > 0) {
                revenue_growth = (((revenue - prev_revenue) / prev_revenue) * 100).toFixed(1) + "%";
            }
        }

        res.json({
            summary: { 
                total_transaction: total_transaction_all, 
                items_sold, 
                revenue, 
                total_profit, 
                total_loss,
                average_sale, 
                revenue_growth 
            },
            status_breakdown: { success: statusBreakdown.success, pending: statusBreakdown.pending, cancelled: statusBreakdown.cancelled },
            details: formattedDetails
        });
    } catch (error) {
        next(error);
    }
};

// 2. PROFIT & LOSS — FIX (SPOILAGE-01): Ikutkan kerugian kedaluwarsa dari InventoryLog
const getProfit = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const userId = req.user.store_id;

        // Query 1: P&L dari transaksi penjualan
        const result = await TransactionDetail.findAll({
            include: [{
                model: Transaction,
                attributes: [],
                where: { ...getDateFilter(startDate, endDate), user_id_fk: userId, status: 'success' }
            }],
            where: { transaction_type: 'sell' },
            attributes: [
                [literal(`SUM(CASE WHEN selling_price > capital_cost THEN (selling_price - capital_cost) * quantity ELSE 0 END)`), "total_profit"],
                [literal(`SUM(CASE WHEN selling_price < capital_cost THEN (capital_cost - selling_price) * quantity ELSE 0 END)`), "sell_loss"],
                [literal(`SUM(selling_price * quantity)`), "total_revenue"]
            ],
            raw: true
        });

        // Query 2: Kerugian kedaluwarsa dari InventoryLog
        // FIX (L1-02): Gunakan buildWIBDateRange — presisi 00:00:00 s/d 23:59:59 WIB
        const spoilageWhere = { user_id_fk: userId, action: 'WRITE_OFF_EXPIRED' };
        const dateRange = buildWIBDateRange(startDate, endDate);
        if (dateRange) spoilageWhere.createdAt = dateRange;

        const spoilageData = await InventoryLog.findAll({
            where: spoilageWhere,
            attributes: [
                [fn('SUM', col('spoilage_loss')), 'total_spoilage'],
                [fn('SUM', col('quantity')), 'total_qty_destroyed']
            ],
            raw: true
        });

        const profit     = parseInt(result[0]?.total_profit)  || 0;
        const sell_loss  = parseInt(result[0]?.sell_loss)     || 0;
        const revenue    = parseInt(result[0]?.total_revenue) || 0;
        const spoilage_loss      = parseInt(spoilageData[0]?.total_spoilage)      || 0;
        const qty_destroyed      = parseInt(spoilageData[0]?.total_qty_destroyed) || 0;

        // Total kerugian nyata = jual rugi + modal produk expired yang dimusnahkan
        const total_loss = sell_loss + spoilage_loss;
        const net_income = profit - total_loss;
        const profit_margin = revenue > 0 ? ((net_income / revenue) * 100).toFixed(2) : 0;

        res.json({ 
            revenue, 
            total_profit: profit, 
            sell_loss,         // Kerugian dari jual di bawah modal
            spoilage_loss,     // Kerugian dari pemusnahan stok expired
            total_loss,        // Gabungan kedua sumber kerugian
            qty_destroyed,     // Total unit yang dimusnahkan
            net_income, 
            profit_margin: `${profit_margin}%` 
        });
    } catch (error) {
        next(error);
    }
};

// 3. TOP PRODUCT
const getTopProduct = async (req, res, next) => {
    try {
        const { startDate, endDate, limit } = req.query;
        const userId = req.user.store_id;

        // 1. Dapatkan Top Products berdasarkan filter UI
        const rows = await TransactionDetail.findAll({
            attributes: [
                [fn("SUM", col("quantity")), "sold"],
                [fn("SUM", literal("quantity * selling_price")), "revenue"],
                [literal("SUM((selling_price - capital_cost) * quantity)"), "laba"]
            ],
            include: [
                // paranoid: false agar barang dihapus tetap muncul laporannya, tapi kita butuh deletedAt untuk disaring
                { model: Product, attributes: ["product_name", "product_stock", "createdAt", "deletedAt"], required: true, paranoid: false },
                { model: Transaction, attributes: [], where: { ...getDateFilter(startDate, endDate), user_id_fk: userId, status: 'success' } }
            ],
            where: { transaction_type: 'sell' },
            group: ["Product.product_id", "Product.product_name", "Product.product_stock", "Product.createdAt", "Product.deletedAt"],
            order: [[literal("sold"), "DESC"]],
            limit: sanitizeLimit(limit),
            raw: true
        });

        // 2. Ambil ID produk untuk sub-query 30 hari absolut
        const productIds = rows.map(r => r["Product.product_id"]);

        // Create a productMap for the service
        const productDataMap = {};
        rows.forEach(r => {
            productDataMap[r["Product.product_id"]] = {
                product_stock: r["Product.product_stock"],
                createdAt: r["Product.createdAt"],
                deletedAt: r["Product.deletedAt"]
            };
        });

        // 3. Panggil Otak AI terpusat
        const { calculateRestockForProducts } = require('../services/aiRestockService');
        const restockSuggestions = await calculateRestockForProducts(userId, productIds, productDataMap);

        // 4. Map final
        res.json(rows.map(item => {
            const productId = item["Product.product_id"];
            const revenue = parseFloat(item.revenue) || 0;
            const laba = parseFloat(item.laba) || 0;
            const margin = revenue > 0 ? ((laba / revenue) * 100).toFixed(1) : 0;
            const sold = parseInt(item.sold) || 0; // Sold in UI Filter
            const currentStock = parseInt(item["Product.product_stock"]) || 0;
            
            const aiData = restockSuggestions[productId] || { suggested_restock: 0, stock_on_order: 0, velocity: 0 };
            
            return {
                product_id: productId,
                product_name: item["Product.product_name"],
                sold,
                revenue,
                laba,
                margin: `${margin}%`,
                current_stock: currentStock,
                stock_on_order: aiData.stock_on_order,
                suggested_restock: aiData.suggested_restock
            };
        }));
    } catch (error) {
        next(error);
    }
};

// 4. MONTHLY REPORT 
const getMonthly = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const userId = req.user.store_id;

        const rows = await TransactionDetail.findAll({
            include: [{
                model: Transaction,
                attributes: [],
                where: { ...getDateFilter(startDate, endDate), user_id_fk: userId, status: 'success' }
            }],
            where: { transaction_type: 'sell' },
            attributes: [
                [fn("DATE_FORMAT", col("Transaction.transaction_datetime"), "%Y-%m"), "month"],
                [literal(`SUM(selling_price * quantity)`), "revenue"],
                [literal(`SUM(CASE WHEN selling_price > capital_cost THEN (selling_price - capital_cost) * quantity ELSE 0 END)`), "laba_bersih"],
                [fn("COUNT", fn("DISTINCT", col("Transaction.transaction_id"))), "total_transaction"]
            ],
            group: [fn("DATE_FORMAT", col("Transaction.transaction_datetime"), "%Y-%m")],
            order: [[literal("month"), "ASC"]],
            raw: true
        });

        res.json(rows.map(item => ({
            month: item.month,
            revenue: parseFloat(item.revenue) || 0,
            laba_bersih: parseFloat(item.laba_bersih) || 0, 
            total_transaction: parseInt(item.total_transaction) || 0,
            average_sale: parseInt(item.total_transaction) > 0 ? (parseFloat(item.revenue) / parseInt(item.total_transaction)) : 0
        })));
    } catch (error) {
        next(error);
    }
};

// 5. BARANG RUGI
const getLossProducts = async (req, res, next) => {
    try {
        const { startDate, endDate, limit } = req.query;
        const userId = req.user.store_id;

        const rows = await TransactionDetail.findAll({
            attributes: [
                [literal("SUM(CASE WHEN selling_price < capital_cost THEN quantity ELSE 0 END)"), "sold"],
                [literal("SUM(CASE WHEN selling_price < capital_cost THEN capital_cost * quantity ELSE 0 END) / SUM(CASE WHEN selling_price < capital_cost THEN quantity ELSE 0 END)"), "modal"], 
                [literal("SUM(CASE WHEN selling_price < capital_cost THEN selling_price * quantity ELSE 0 END) / SUM(CASE WHEN selling_price < capital_cost THEN quantity ELSE 0 END)"), "harga_jual"], 
                [literal("SUM(CASE WHEN selling_price < capital_cost THEN (capital_cost - selling_price) * quantity ELSE 0 END)"), "rugi"]
            ],
            include: [
                { model: Product, attributes: ["product_name"], required: true, paranoid: false },
                { model: Transaction, attributes: [], where: { ...getDateFilter(startDate, endDate), user_id_fk: userId, status: 'success' } }
            ],
            where: { transaction_type: 'sell' },
            having: literal('SUM(CASE WHEN selling_price < capital_cost THEN (capital_cost - selling_price) * quantity ELSE 0 END) > 0'),
            group: ["Product.product_id", "Product.product_name"],
            order: [[literal("rugi"), "DESC"]],
            limit: sanitizeLimit(limit),
            raw: true
        });

        res.json(rows.map(item => ({
            product_id: item["Product.product_id"],
            product_name: item["Product.product_name"],
            sold: parseInt(item.sold) || 0,
            modal: parseInt(item.modal) || 0,
            harga_jual: parseInt(item.harga_jual) || 0,
            rugi: parseInt(item.rugi) || 0
        })));
    } catch (error) {
        next(error);
    }
};

// 6. SPOILAGE LOG — FIX (SPOILAGE-01 + L1-02 + L1-03)
// GROUP BY product — Top 50 produk paling sering kedaluwarsa
// Mencegah DOM explosion (toko lama = ribuan event) + presisi timezone WIB
const getSpoilageLoss = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const userId = req.user.store_id;

        // FIX (L1-02): Timezone-aware date boundaries (WIB 00:00:00 — 23:59:59)
        const spoilageWhere = { user_id_fk: userId, action: 'WRITE_OFF_EXPIRED' };
        const dateRange = buildWIBDateRange(startDate, endDate);
        if (dateRange) spoilageWhere.createdAt = dateRange;

        // FIX (L1-03): GROUP BY product (bukan per-event) — max 50 baris
        // Ini mencegah browser crash saat toko lama membuka modal "Sepanjang Waktu"
        const logs = await InventoryLog.findAll({
            where: spoilageWhere,
            attributes: [
                'product_id_fk',
                [fn('SUM', col('quantity')),      'total_qty'],
                [fn('SUM', col('spoilage_loss')), 'total_loss'],
                [fn('MAX', col('InventoryLog.createdAt')),      'last_destroyed_at'],
                [fn('COUNT', col('InventoryLog.id')), 'event_count']
            ],
            include: [{ 
                model: Product, 
                as: 'Product',
                attributes: ['product_name'],
                required: false,
                paranoid: false  // FIX (L1-01): Produk soft-deleted tetap muncul di laporan forensik
            }],
            group: ['product_id_fk', 'Product.product_id', 'Product.product_name'],
            order: [[literal('total_loss'), 'DESC']],
            limit: 50  // Anti-DOM explosion: max 50 produk teratas
        });

        res.json(logs.map(log => ({
            product_name:     log.Product?.product_name || 'Produk Dihapus',
            total_qty:        parseInt(log.dataValues.total_qty)    || 0,
            total_loss:       parseInt(log.dataValues.total_loss)   || 0,
            event_count:      parseInt(log.dataValues.event_count)  || 0,
            last_destroyed_at: log.dataValues.last_destroyed_at
        })));
    } catch (error) {
        next(error);
    }
};

module.exports = { getSummary, getProfit, getTopProduct, getMonthly, getLossProducts, getSpoilageLoss };