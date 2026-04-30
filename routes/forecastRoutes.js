const express = require('express');
const router = express.Router();

// Import Middleware 
const verifyToken = require('../middleware/authMiddleware');

// import fungsi dari controller
const { getForecast } = require('../controllers/forecastController');

// rute sales forecast 
router.get('/', verifyToken, getForecast);

module.exports = router;