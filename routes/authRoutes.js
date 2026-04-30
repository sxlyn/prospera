const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/authMiddleware'); 
const { register, deleteUser, login } = require('../controllers/authController');

// Rute untuk registrasi akun baru
router.post('/register', register);

// Rute untuk masuk 
router.post('/login', login);

// Rute untuk menghapus akun 
router.delete('/delete', verifyToken, deleteUser);

module.exports = router;