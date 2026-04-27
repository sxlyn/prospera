const { Product } = require('../models');
const { Op } = require('sequelize');

const getLowStock = async (req, res) => {
    try {
        console.log(req.user);

        const userId = req.user.id || req.user.user_id;
        const stockLimit = req.query.limit || 5;

        const products = await Product.findAll({
            where: {
                user_id_fk: userId,
                product_stock: {
                    [Op.lt]: stockLimit
                }
            },
            attributes: ['product_name', 'product_stock'],
            order: [['product_stock', 'ASC']]
        });

        res.status(200).json({
            alert: "Produk dengan stok rendah",
            threshold: stockLimit,
            total: products.length,
            data: products
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Terjadi kesalahan internal pada server." });
    }
};

module.exports = { getLowStock };