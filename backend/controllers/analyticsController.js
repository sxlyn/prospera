const { Transaction, TransactionDetail, Product } = require("../models");
const { Op, fn, col, literal } = require("sequelize");
const { getDateFilter } = require("../utils/dateUtils");
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
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) || 1;

            const prevEnd = new Date(start);
            prevEnd.setDate(prevEnd.getDate() - 1);
            const prevStart = new Date(prevEnd);
            prevStart.setDate(prevStart.getDate() - diffDays + 1);

            const prevFinancialData = await TransactionDetail.findAll({
                include: [{
                    model: Transaction,
                    attributes: [],
                    where: { ...getDateFilter(prevStart.toISOString().split('T')[0], prevEnd.toISOString().split('T')[0]), user_id_fk: userId, status: 'success' }
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

// 2. PROFIT & LOSS
const getProfit = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const userId = req.user.store_id;

        const result = await TransactionDetail.findAll({
            include: [{
                model: Transaction,
                attributes: [],
                where: { ...getDateFilter(startDate, endDate), user_id_fk: userId, status: 'success' }
            }],
            where: { transaction_type: 'sell' },
            attributes: [
                [literal(`SUM(CASE WHEN selling_price > capital_cost THEN (selling_price - capital_cost) * quantity ELSE 0 END)`), "total_profit"],
                [literal(`SUM(CASE WHEN selling_price < capital_cost THEN (capital_cost - selling_price) * quantity ELSE 0 END)`), "total_loss"],
                [literal(`SUM(selling_price * quantity)`), "total_revenue"]
            ],
            raw: true
        });

        const profit = parseFloat(result[0].total_profit) || 0;
        const loss = parseFloat(result[0].total_loss) || 0;
        const revenue = parseFloat(result[0].total_revenue) || 0;
        
        const net_income = profit - loss;
        const profit_margin = revenue > 0 ? ((net_income / revenue) * 100).toFixed(2) : 0;

        res.json({ revenue, total_profit: profit, total_loss: loss, net_income, profit_margin: `${profit_margin}%` });
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
                [fn("SUM", col("quantity")), "sold"],
                [fn("MAX", col("capital_cost")), "modal"], 
                [fn("MAX", col("selling_price")), "harga_jual"], 
                [literal("SUM((capital_cost - selling_price) * quantity)"), "rugi"]
            ],
            include: [
                { model: Product, attributes: ["product_name"], required: true, paranoid: false },
                { model: Transaction, attributes: [], where: { ...getDateFilter(startDate, endDate), user_id_fk: userId, status: 'success' } }
            ],
            where: { transaction_type: 'sell', ...Object.fromEntries([]) },
            having: literal('SUM((capital_cost - selling_price) * quantity) > 0'),
            group: ["Product.product_id", "Product.product_name"],
            order: [[literal("rugi"), "DESC"]],
            limit: sanitizeLimit(limit),
            raw: true
        });

        res.json(rows.map(item => ({
            product_id: item["Product.product_id"],
            product_name: item["Product.product_name"],
            sold: parseInt(item.sold) || 0,
            modal: parseFloat(item.modal) || 0,
            harga_jual: parseFloat(item.harga_jual) || 0,
            rugi: parseFloat(item.rugi) || 0
        })));
    } catch (error) {
        next(error);
    }
};

module.exports = { getSummary, getProfit, getTopProduct, getMonthly, getLossProducts };