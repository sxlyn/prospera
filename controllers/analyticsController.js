const { Transaction, TransactionDetail, Product } = require("../models");
const { Op, fn, col, literal } = require("sequelize");


// HELPER: FILTER TANGGAL (FIX JAM 23:59:59)
// ============================
const getDateFilter = (startDate, endDate) => {
    if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        return {
            transaction_datetime: {
                [Op.between]: [start, end]
            }
        };
    }
    return {};
};


// 1. SUMMARY
// ============================
const getSummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const userId = req.user.id;

        const result = await Transaction.findAll({
            where: {
                ...getDateFilter(startDate, endDate),
                user_id_fk: userId,
                status: 'success' // FILTER STATUS DITAMBAHKAN
            },
            attributes: [
                [fn('COUNT', col('*')), 'total_transaction'],
                [fn('SUM', col('total_amount')), 'revenue'],
                [fn('AVG', col('total_amount')), 'average_sale']
            ],
            raw: true
        });

        const data = result[0];
        res.json({
            total_transaction: parseInt(data.total_transaction) || 0,
            revenue: parseFloat(data.revenue) || 0,
            average_sale: parseFloat(data.average_sale) || 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// 2. PROFIT & LOSS
// ============================
const getProfit = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const userId = req.user.id;

        const result = await TransactionDetail.findAll({
            include: [{
                model: Transaction,
                attributes: [],
                where: {
                    ...getDateFilter(startDate, endDate),
                    user_id_fk: userId,
                    status: 'success' // FILTER STATUS DITAMBAHKAN
                }
            }],
            attributes: [
                [
                    literal(`SUM(CASE WHEN selling_price > capital_cost THEN (selling_price - capital_cost) * quantity ELSE 0 END)`),
                    "total_profit"
                ],
                [
                    literal(`SUM(CASE WHEN selling_price < capital_cost THEN (capital_cost - selling_price) * quantity ELSE 0 END)`),
                    "total_loss"
                ],
                [
                    literal(`SUM(selling_price * quantity)`),
                    "total_revenue"
                ]
            ],
            raw: true
        });

        const profit = parseFloat(result[0].total_profit) || 0;
        const loss = parseFloat(result[0].total_loss) || 0;
        const revenue = parseFloat(result[0].total_revenue) || 0;
        
        const net_income = profit - loss;
        const profit_margin = revenue > 0 
            ? ((net_income / revenue) * 100).toFixed(2) 
            : 0;

        res.json({
            revenue,
            total_profit: profit,
            total_loss: loss,
            net_income,
            profit_margin: `${profit_margin}%`
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. TOP PRODUCT
// ============================
const getTopProduct = async (req, res) => {
    try {
        const { startDate, endDate, limit } = req.query;
        const userId = req.user.id;

        const rows = await TransactionDetail.findAll({
            attributes: [
                [fn("SUM", col("quantity")), "sold"],
                [fn("SUM", literal("quantity * selling_price")), "revenue"]
            ],
            include: [
                {
                    model: Product,
                    attributes: ["product_name"],
                    required: true
                },
                {
                    model: Transaction,
                    attributes: [],
                    where: {
                        ...getDateFilter(startDate, endDate),
                        user_id_fk: userId,
                        status: 'success' // FILTER STATUS DITAMBAHKAN
                    }
                }
            ],
            group: ["Product.product_id", "Product.product_name"],
            order: [[literal("sold"), "DESC"]],
            limit: limit ? parseInt(limit) : 5,
            raw: true
        });

        res.json(rows.map(item => ({
            product_name: item["Product.product_name"],
            sold: parseInt(item.sold) || 0,
            revenue: parseFloat(item.revenue) || 0
        })));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 4. MONTHLY REPORT
// ============================
const getMonthly = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const userId = req.user.id;
        const timeZoneAdj = "CONVERT_TZ(transaction_datetime, '+00:00', '+07:00')";

        const rows = await Transaction.findAll({
            where: {
                ...getDateFilter(startDate, endDate),
                user_id_fk: userId,
                status: 'success' // FILTER STATUS DITAMBAHKAN
            },
            attributes: [
                [fn("DATE_FORMAT", col("transaction_datetime"), "%Y-%m"), "month"],
                [fn("SUM", col("total_amount")), "revenue"],
                [fn("COUNT", col("*")), "total_transaction"],
                [fn("AVG", col("total_amount")), "average_sale"]
            ],
            group: [fn("DATE_FORMAT", col("transaction_datetime"), "%Y-%m")],
            order: [[literal("month"), "ASC"]],
            raw: true
        });

        res.json(rows.map(item => ({
            month: item.month,
            revenue: parseFloat(item.revenue) || 0,
            total_transaction: parseInt(item.total_transaction) || 0,
            average_sale: parseFloat(item.average_sale) || 0
        })));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getSummary, getProfit, getTopProduct, getMonthly };