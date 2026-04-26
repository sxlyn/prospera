const db = require("../config/db");

// Summary
const getSummary = async (req, res) => {
    try {
        const sql = `
            SELECT 
            COUNT(*) AS total_transaction,
            SUM(total_amount) AS revenue,
            AVG(total_amount) AS average_sale
            FROM Transactions
        `;

        const [rows] = await db.query(sql);
        res.json(rows[0]);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Profit
const getProfit = async (req, res) => {
    try {
        const sql = `
        SELECT
        SUM(
            CASE 
                WHEN selling_price > capital_cost
                THEN (selling_price - capital_cost) * quantity
                ELSE 0
            END
        ) AS total_profit,

        SUM(
            CASE 
                WHEN selling_price < capital_cost
                THEN (capital_cost - selling_price) * quantity
                ELSE 0
            END
        ) AS total_loss

        FROM Transaction_details
        `;

        const [rows] = await db.query(sql);

        const profit = rows[0].total_profit || 0;
        const loss = rows[0].total_loss || 0;

        res.json({
            total_profit: profit,
            total_loss: loss,
            net_income: profit - loss
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Top Product
const getTopProduct = async (req, res) => {
    try {
        const sql = `
            SELECT p.product_name, SUM(td.quantity) AS sold
            FROM Transaction_details td
            JOIN Products p ON td.product_id_fk = p.product_id
            GROUP BY p.product_name
            ORDER BY sold DESC
            LIMIT 5
        `;

        const [rows] = await db.query(sql);
        res.json(rows);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Monthly
const getMonthly = async (req, res) => {
    try {
        const sql = `
            SELECT DATE_FORMAT(transaction_datetime,'%Y-%m') AS month,
            SUM(total_amount) AS sales
            FROM Transactions
            GROUP BY DATE_FORMAT(transaction_datetime,'%Y-%m')
        `;

        const [rows] = await db.query(sql);
        res.json(rows);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getSummary,
    getProfit,
    getTopProduct,
    getMonthly
};