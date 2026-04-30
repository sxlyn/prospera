const express = require('express');
const router = express.Router();

// Import Middleware 
const verifyToken = require('../middleware/authMiddleware'); 

// Import fungsi dari controller
const { createTransaction, getTransactionHistory } = require('../controllers/transactionController');

// Rute Kasir: Untuk melakukan pembayaran/Checkout
router.post('/checkout', verifyToken, createTransaction);

// Rute History: Untuk melihat daftar transaksi/penjualan sebelumnya
router.get('/history', verifyToken, getTransactionHistory);

module.exports = router;