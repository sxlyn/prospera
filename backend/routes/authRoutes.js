const express = require('express');
const router = express.Router();

// Import Middleware
const verifyToken = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/authorizeRole');
const { authLimiter } = require('../middleware/rateLimiter');
const { validateRegister, validateLogin, validateChangePassword } = require('../middleware/validationMiddleware');

// Import fungsi dari Controller
const { register, login, createUser, getAllUsers, deleteUserById, deleteUser, changePassword } = require('../controllers/authController');

// === RUTE PUBLIK (Rate Limited) ===

// Registrasi Owner pertama (tertutup otomatis setelah ada 1 user)
router.post('/register', authLimiter, validateRegister, register);

// Login
router.post('/login', authLimiter, validateLogin, login);

// === RUTE USER MANAGEMENT (Owner Only) ===

// Owner melihat daftar semua user
router.get('/users', verifyToken, authorizeRole('owner'), getAllUsers);

// Owner membuat akun Karyawan baru
router.post('/users', verifyToken, authorizeRole('owner'), validateRegister, createUser);

// Owner menghapus akun Karyawan
router.delete('/users/:id', verifyToken, authorizeRole('owner'), deleteUserById);

// === RUTE SELF-SERVICE ===

// User menghapus akun sendiri
router.delete('/delete', verifyToken, deleteUser);

// User mengganti password
router.put('/change-password', verifyToken, validateChangePassword, changePassword);

module.exports = router;