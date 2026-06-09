const express = require('express');
const router = express.Router();

// Import Middleware
const verifyToken = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/authorizeRole');

// Import fungsi dari Controller
const { getForecast } = require('../controllers/forecastController');

// Rute sales forecast — Owner only (prediksi bisnis)
router.get('/', verifyToken, authorizeRole('owner'), getForecast);

module.exports = router;