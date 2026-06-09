const { Product } = require('../models');
const { Op } = require('sequelize');
const { CRITICAL_THRESHOLD } = require('../utils/stockHelper');

const getLowStock = async (req, res, next) => {
    try {
        const userId = req.user.store_id;

        // SINGLE SOURCE OF TRUTH: Selalu gunakan standar backend (CRITICAL_THRESHOLD)
        const stockLimit = CRITICAL_THRESHOLD; 

        const products = await Product.findAll({
            where: {
                user_id_fk: userId,
                product_stock: {
                    [Op.lte]: stockLimit
                }
            },
            attributes: ['product_id', 'product_name', 'product_stock'],
            order: [['product_stock', 'ASC']]
        });

        res.status(200).json({
            alert: "Produk dengan stok rendah",
            threshold: stockLimit,
            total: products.length,
            data: products
        });

    } catch (error) {
        next(error);
    }
};

module.exports = { getLowStock };