const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRole = require("../middleware/authorizeRole");

// Import fungsi analitik dari analyticsController
const {
    getSummary,
    getProfit,
    getTopProduct,
    getMonthly,
    getLossProducts
} = require("../controllers/analyticsController");

// Import fungsi export dari exportController
const {
    exportSummaryExcel,
    exportSummaryCsv 
} = require("../controllers/exportController");

// Routes — Semua analitik HANYA bisa diakses oleh Owner
router.get("/summary", authMiddleware, authorizeRole('owner'), getSummary);
router.get("/profit", authMiddleware, authorizeRole('owner'), getProfit);
router.get("/top-product", authMiddleware, authorizeRole('owner'), getTopProduct);
router.get("/monthly", authMiddleware, authorizeRole('owner'), getMonthly);
router.get("/loss-products", authMiddleware, authorizeRole('owner'), getLossProducts);

router.get("/summary/export/excel", authMiddleware, authorizeRole('owner'), exportSummaryExcel); 
router.get("/summary/export/csv", authMiddleware, authorizeRole('owner'), exportSummaryCsv);

module.exports = router;