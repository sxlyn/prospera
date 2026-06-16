/**
 * analyticsService.js — Shared Analytics Query Layer
 * REFACTOR (B-T14/B-T15): Menghilangkan duplikasi query antara
 * analyticsController.js dan exportController.js.
 * 
 * Semua query keuangan terpusat di sini sebagai Single Source of Truth.
 * Jika ada bug fix atau perubahan filter, cukup ubah di satu tempat.
 */

const { Transaction, TransactionDetail, Product } = require("../models");
const { fn, col, literal } = require("sequelize");
const { getDateFilter } = require("../utils/dateUtils");

/**
 * Hitung breakdown status transaksi (success, pending, cancelled)
 * @param {string} startDate - Tanggal awal filter (opsional)
 * @param {string} endDate - Tanggal akhir filter (opsional)
 * @param {number} userId - store_id untuk isolasi tenant
 * @returns {{ success, pending, cancelled, total_transaction_all }}
 */
const getStatusBreakdown = async (startDate, endDate, userId) => {
    const statusData = await Transaction.findAll({
        where: { ...getDateFilter(startDate, endDate), user_id_fk: userId },
        attributes: ['status', [fn('COUNT', col('*')), 'count']],
        group: ['status'],
        raw: true
    });

    let success = 0, pending = 0, cancelled = 0, total_transaction_all = 0;
    statusData.forEach(item => {
        const count = parseInt(item.count);
        if (item.status === 'success') success = count;
        if (item.status === 'pending') pending = count;
        if (item.status === 'cancelled') cancelled = count;
        total_transaction_all += count;
    });

    return { success, pending, cancelled, total_transaction_all };
};

/**
 * Hitung ringkasan keuangan (items_sold, revenue, total_profit)
 * PENTING: Hanya menghitung transaksi PENJUALAN (transaction_type = 'sell')
 * @param {string} startDate 
 * @param {string} endDate 
 * @param {number} userId 
 * @returns {{ items_sold, revenue, total_profit }}
 */
const getFinancialSummary = async (startDate, endDate, userId) => {
    const financialData = await TransactionDetail.findAll({
        include: [{
            model: Transaction,
            attributes: [],
            where: { ...getDateFilter(startDate, endDate), user_id_fk: userId, status: 'success' }
        }],
        where: { transaction_type: 'sell' },
        attributes: [
            [fn('SUM', col('quantity')), 'items_sold'],
            [literal(`SUM(selling_price * quantity)`), 'revenue'],
            [literal(`SUM(CASE WHEN selling_price > capital_cost THEN (selling_price - capital_cost) * quantity ELSE 0 END)`), 'total_profit']
        ],
        raw: true
    });

    const fin = financialData[0] || {};
    return {
        items_sold: parseInt(fin.items_sold) || 0,
        revenue: parseFloat(fin.revenue) || 0,
        total_profit: parseFloat(fin.total_profit) || 0
    };
};

/**
 * Ambil breakdown per produk (qty, subtotal, profit, margin)
 * Dipakai oleh getSummary (analytics) DAN export Excel/CSV
 * @param {string} startDate 
 * @param {string} endDate 
 * @param {number} userId 
 * @param {object} options - { includeProfit: boolean, includeUnitPrice: boolean }
 * @returns {Array} Daftar produk dengan statistik penjualan
 */
const getProductBreakdown = async (startDate, endDate, userId, options = {}) => {
    const { includeProfit = false, includeUnitPrice = false } = options;

    // Build dynamic attributes
    const attributes = [
        [fn("SUM", col("quantity")), "qty"],
        [fn("SUM", literal("quantity * selling_price")), "subtotal"]
    ];

    if (includeProfit) {
        attributes.push(
            [literal("SUM((selling_price - capital_cost) * quantity)"), "total_profit_product"]
        );
    }
    if (includeUnitPrice) {
        attributes.push(
            [literal("MAX(selling_price)"), "unit_price"]
        );
    }

    const detailsData = await TransactionDetail.findAll({
        attributes,
        include: [
            { model: Product, attributes: ["product_name"], required: true, paranoid: false },
            { model: Transaction, attributes: [], where: { ...getDateFilter(startDate, endDate), user_id_fk: userId, status: 'success' } }
        ],
        where: { transaction_type: 'sell' },
        group: ["Product.product_id", "Product.product_name"],
        order: [[literal("qty"), "DESC"]],
        raw: true
    });

    return detailsData.map(item => {
        const result = {
            name: item["Product.product_name"],
            qty: parseInt(item.qty) || 0,
            subtotal: parseFloat(item.subtotal) || 0
        };

        if (includeProfit) {
            const profit = parseFloat(item.total_profit_product) || 0;
            const margin = result.subtotal > 0 ? ((profit / result.subtotal) * 100).toFixed(1) : 0;
            result.profit = profit;
            result.margin = margin + "%";
        }
        if (includeUnitPrice) {
            result.unitPrice = parseFloat(item.unit_price) || 0;
        }

        return result;
    });
};

module.exports = { getStatusBreakdown, getFinancialSummary, getProductBreakdown };
