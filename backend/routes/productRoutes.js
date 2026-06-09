const express = require('express');
const router = express.Router();

// Import Middleware
const verifyToken = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/authorizeRole');
const { validateProduct, validateIdParam } = require('../middleware/validationMiddleware');

// Import semua fungsi dari Controller
const { 
    getAllProducts, 
    getProductById,
    createProduct, 
    updateProduct, 
    deleteProduct 
} = require('../controllers/productController');

// Daftar rute produk (dilindungi JWT + RBAC + validasi input)
router.get('/', verifyToken, getAllProducts);                                                              // Semua role bisa lihat
router.get('/:id', verifyToken, validateIdParam, getProductById);                                          // Semua role bisa lihat
router.post('/', verifyToken, authorizeRole('owner'), validateProduct, createProduct);                      // Owner only
router.put('/:id', verifyToken, authorizeRole('owner'), validateIdParam, validateProduct, updateProduct);   // Owner only
router.delete('/:id', verifyToken, authorizeRole('owner'), validateIdParam, deleteProduct);                 // Owner only

module.exports = router;