const express = require('express');
const router = express.Router();

// Import Middleware
const verifyToken = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/authorizeRole');

// Import fungsi dari Controller
const { getLowStock } = require('../controllers/inventoryController');

// Rute inventory alert — Owner only (data stok kritis)
router.get('/low-stock', verifyToken, authorizeRole('owner'), getLowStock);

module.exports = router;