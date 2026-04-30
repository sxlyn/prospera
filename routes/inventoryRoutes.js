const express = require('express');
const router = express.Router();

// import middleware
const verifyToken = require('../middleware/authMiddleware');

// import fungsi dari controller
const { getLowStock } = require('../controllers/inventoryController');

// rute inventory alert 
router.get('/low-stock', verifyToken, getLowStock);

module.exports = router;