const express = require('express');
const router = express.Router();

// Import Middleware 
const verifyToken = require('../middleware/authMiddleware');
const { validateTransaction } = require('../middleware/validationMiddleware');

// Import fungsi dari Controller
const { createTransaction, getTransactionHistory } = require('../controllers/transactionController');

// Rute Transaksi: Untuk melakukan pembayaran/Checkout (dilindungi JWT + validasi input)
router.post('/checkout', verifyToken, validateTransaction, createTransaction);

// Rute History: Untuk melihat daftar transaksi/penjualan sebelumnya
router.get('/history', verifyToken, getTransactionHistory);

module.exports = router;