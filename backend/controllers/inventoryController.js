const { Product } = require('../models');
const { Op, fn, col } = require('sequelize');

const getLowStock = async (req, res, next) => {
    try {
        const userId = req.user.store_id;

        const products = await Product.findAll({
            where: {
                user_id_fk: userId,
                product_stock: {
                    [Op.lte]: fn('GREATEST', col('min_display_qty'), col('calculated_reorder_point'))
                }
            },
            attributes: ['product_id', 'product_name', 'product_stock', 'min_display_qty', 'calculated_reorder_point'],
            order: [['product_stock', 'ASC']]
        });

        res.status(200).json({
            alert: "Produk dengan stok rendah",
            total: products.length,
            data: products
        });

    } catch (error) {
        next(error);
    }
};

module.exports = { getLowStock };