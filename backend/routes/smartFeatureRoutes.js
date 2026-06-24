const express = require('express');
const router = express.Router();
const smartFeatureController = require('../controllers/smartFeatureController');
const verifyToken = require('../middleware/authMiddleware');
// FIX (CRITICAL-06): Import authorizeRole untuk mengamankan endpoint mutasi
const authorizeRole = require('../middleware/authorizeRole');

// GET endpoints — dapat diakses kedua role (owner dan karyawan boleh lihat data)
router.get('/expiring', verifyToken, smartFeatureController.getExpiringProducts);
router.get('/anomalies', verifyToken, smartFeatureController.getAnomalies);

// PUT endpoints — OWNER ONLY: operasi write yang mempengaruhi harga, stok, dan audit
router.put('/apply-markdown', verifyToken, authorizeRole('owner'), smartFeatureController.applyMarkdown);
router.put('/anomalies/resolve', verifyToken, authorizeRole('owner'), smartFeatureController.resolveAnomaly);
router.put('/expiry/write-off', verifyToken, authorizeRole('owner'), smartFeatureController.writeOffExpiredStock);

module.exports = router;
