const express = require('express');
const router = express.Router();
const smartFeatureController = require('../controllers/smartFeatureController');
const verifyToken = require('../middleware/authMiddleware');

router.get('/expiring', verifyToken, smartFeatureController.getExpiringProducts);
router.put('/apply-markdown', verifyToken, smartFeatureController.applyMarkdown);
router.get('/anomalies', verifyToken, smartFeatureController.getAnomalies);
router.put('/anomalies/resolve', verifyToken, smartFeatureController.resolveAnomaly);

module.exports = router;
