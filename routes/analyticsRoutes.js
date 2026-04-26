const express = require("express");
const router = express.Router();

// Middleware auth (kalau project timmu pakai proteksi JWT)
const authMiddleware = require("../middleware/authMiddleware");

// Import controller analytics
const {
    getSummary,
    getProfit,
    getTopProduct,
    getMonthly
} = require("../controllers/analyticsController");

// Routes
router.get("/summary", authMiddleware, getSummary);

router.get("/profit", authMiddleware, getProfit);

router.get("/top-product", authMiddleware, getTopProduct);

router.get("/monthly", authMiddleware, getMonthly);

module.exports = router;