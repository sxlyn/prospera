const { Product } = require('../models');
const { getStockStatus } = require('../utils/stockHelper');

// Mengambil seluruh data produk berdasarkan ID pengguna yang sedang masuk.
const getAllProducts = async (req, res, next) => {
    try {
        const userId = req.user.store_id; 
        // Default page 1, default limit 1000 untuk backward compatibility jika client belum pakai pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 1000;
        const offset = (page - 1) * limit;

        const { count, rows } = await Product.findAndCountAll({
            where: { user_id_fk: userId },
            limit: limit,
            offset: offset,
            order: [['product_id', 'DESC']] 
        });

        // Terapkan fungsi dari Shared Helper ke setiap produk
        const productsWithStatus = rows.map(p => {
            const productData = p.toJSON();
            productData.stock_status = getStockStatus(productData.product_stock); 
            return productData;
        });

        res.status(200).json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            products: productsWithStatus
        });
    } catch (error) {
        next(error);
    }
};

// Mengambil satu data produk spesifik
const getProductById = async (req, res, next) => {
    try {
        const userId = req.user.store_id;
        const productId = req.params.id;

        const product = await Product.findOne({
            where: { 
                product_id: productId, 
                user_id_fk: userId 
            }
        });
        
        if (!product) {
            return res.status(404).json({ message: "Produk tidak ditemukan." });
        }
        res.status(200).json(product);
    } catch (error) {
        next(error);
    }
};

// Menambahkan data produk baru
const createProduct = async (req, res, next) => {
    try {
        const userId = req.user.store_id; 
        const { product_name, product_cost, product_price, product_stock } = req.body;
        
        // Cek duplikasi nama produk (logika bisnis, tetap di controller)
        const existingProduct = await Product.findOne({
            where: {
                user_id_fk: userId,
                product_name: product_name
            }
        });

        if (existingProduct) {
            return res.status(400).json({ message: `Produk dengan nama "${product_name}" sudah ada di toko Anda.` });
        }

        const newProduct = await Product.create({
            user_id_fk: userId,
            product_name: product_name,
            product_cost: product_cost,
            product_price: product_price,
            product_stock: product_stock
        });

        res.status(201).json({ 
            message: "Produk berhasil ditambahkan ke toko Anda.", 
            productId: newProduct.product_id 
        });
    } catch (error) {
        next(error);
    }
};

// Memperbarui data produk yang sudah ada
const updateProduct = async (req, res, next) => {
    try {
        const userId = req.user.store_id;
        const productId = req.params.id;
        const { product_name, product_cost, product_price, product_stock } = req.body;

        // Cek duplikasi nama produk (logika bisnis, tetap di controller)
        const duplicateProduct = await Product.findOne({
            where: {
                user_id_fk: userId,
                product_name: product_name
            }
        });

        if (duplicateProduct && String(duplicateProduct.product_id) !== String(productId)) {
            return res.status(400).json({ message: `Nama "${product_name}" sudah digunakan oleh produk lain di toko Anda.` });
        }

        const [updatedRows] = await Product.update(
            {
                product_name: product_name,
                product_cost: product_cost,
                product_price: product_price,
                product_stock: product_stock
            },
            {
                where: { 
                    product_id: productId, 
                    user_id_fk: userId 
                }
            }
        );

        if (updatedRows === 0) {
            return res.status(404).json({ message: "Produk tidak ditemukan atau bukan milik Anda." });
        }
        res.status(200).json({ message: "Data produk berhasil diperbarui." });
    } catch (error) {
        next(error);
    }
};

// Menghapus data produk
const deleteProduct = async (req, res, next) => {
    try {
        const userId = req.user.store_id;
        const productId = req.params.id;

        const deletedRows = await Product.destroy({
            where: { 
                product_id: productId, 
                user_id_fk: userId 
            }
        });

        if (deletedRows === 0) {
            return res.status(404).json({ message: "Produk tidak ditemukan atau bukan milik Anda." });
        }
        res.status(200).json({ message: "Produk berhasil dihapus." });
    } catch (error) {
        next(error);
    }
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };