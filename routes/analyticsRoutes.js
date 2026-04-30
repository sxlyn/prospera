const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    getSummary,
    getProfit,
    getTopProduct,
    getMonthly,
    exportSummaryExcel,
    exportSummaryCsv 
} = require("../controllers/analyticsController");

// Routes
router.get("/summary", authMiddleware, getSummary);

router.get("/profit", authMiddleware, getProfit);

router.get("/top-product", authMiddleware, getTopProduct);

router.get("/monthly", authMiddleware, getMonthly);

router.get("/summary/export/excel", authMiddleware, exportSummaryExcel); 
router.get("/summary/export/csv", authMiddleware, exportSummaryCsv);

module.exports = router;