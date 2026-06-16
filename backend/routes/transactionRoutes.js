const express = require('express');
const router = express.Router();

// Import Middleware 
const verifyToken = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/authorizeRole');
const { validateTransaction } = require('../middleware/validationMiddleware');

// Import fungsi dari Controller
const { createTransaction, getTransactionHistory } = require('../controllers/transactionController');

// SECURITY FIX (B-S23): Terapkan RBAC ketat pada endpoint transaksi
// Hanya role 'owner' dan 'karyawan' yang diizinkan — mencegah role tak terduga mengakses endpoint ini
router.post('/checkout', verifyToken, authorizeRole('owner', 'karyawan'), validateTransaction, createTransaction);
router.get('/history', verifyToken, authorizeRole('owner', 'karyawan'), getTransactionHistory);

module.exports = router;