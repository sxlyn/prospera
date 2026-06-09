/**
 * appConfig.js — Pusat Konfigurasi Aplikasi (Single Source of Truth)
 * Semua konstanta kritis didefinisikan di sini untuk mencegah hardcoding berulang.
 */
require('dotenv').config();

module.exports = {
    // --- Konfigurasi Rate Limiter ---
    AUTH_RATE_LIMIT: {
        windowMs: 15 * 60 * 1000, // 15 menit
        max: 10,                  // Maksimal 10 percobaan per jendela waktu
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            message: "Terlalu banyak percobaan dari IP ini. Silakan coba lagi setelah 15 menit."
        }
    },
    API_RATE_LIMIT: {
        windowMs: 15 * 60 * 1000, // 15 menit
        max: 100,                 // Maksimal 100 request per jendela waktu
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            message: "Terlalu banyak permintaan dari IP ini. Silakan coba lagi nanti."
        }
    },

    // --- Konfigurasi JWT ---
    JWT_EXPIRY: '1d',

    // --- Konfigurasi CORS ---
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',

    // --- Konfigurasi Stok (Single Source of Truth) ---
    CRITICAL_THRESHOLD: 30,

    // --- Konfigurasi Body Parser ---
    BODY_SIZE_LIMIT: '10kb'
};
