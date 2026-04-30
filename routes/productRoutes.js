const express = require('express');
const router = express.Router();

// Import Middleware
const verifyToken = require('../middleware/authMiddleware'); 

// Import semua fungsi dari controller
const { 
    getAllProducts, 
    getProductById,
    createProduct, 
    updateProduct, 
    deleteProduct 
} = require('../controllers/productController');

// Daftar rute produk
router.get('/', verifyToken, getAllProducts);          // Rute ambil semua produk
router.get('/:id', verifyToken, getProductById);       // Rute ambil 1 produk secara spesifik
router.post('/', verifyToken, createProduct);          // Rute tambah produk baru
router.put('/:id', verifyToken, updateProduct);        // Rute edit/perbarui produk
router.delete('/:id', verifyToken, deleteProduct);     // Rute hapus produk

module.exports = router;