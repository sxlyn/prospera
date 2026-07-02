/**
 * rateLimiter.js — Middleware Anti Brute-Force & DDoS
 * Menggunakan express-rate-limit untuk membatasi jumlah request per IP.
 */
const rateLimit = require('express-rate-limit');
const { AUTH_RATE_LIMIT, API_RATE_LIMIT } = require('../config/appConfig');

// Limiter ketat untuk endpoint autentikasi (login & register)
const authLimiter = rateLimit(AUTH_RATE_LIMIT);

// Limiter umum untuk seluruh endpoint API
const apiLimiter = rateLimit(API_RATE_LIMIT);

// Limiter sangat ketat untuk endpoint export CSV/Excel (DDoS / Denial of Wallet Protection)
// FIX (BUG-A08): Batas production diperketat ke 5 req/menit.
// SEBELUMNYA: max: 100 di-hardcode (komentar sendiri mengakui "untuk testing") — nilai ini
//             masuk ke production tanpa perubahan dan memungkinkan 100 export besar/menit per IP.
// SESUDAH   : production = 5 req/menit (cukup untuk penggunaan normal), development = 100.
//             Export Excel/CSV adalah operasi berat (DB query + streaming + ExcelJS) yang bisa
//             menghabiskan RAM jika dipanggil bersamaan dalam jumlah besar.
const exportLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 menit
    max: process.env.NODE_ENV === 'production' ? 5 : 100,
    message: { message: "Batas permintaan export tercapai. Silakan tunggu 1 menit sebelum mencoba lagi." }
});

module.exports = { authLimiter, apiLimiter, exportLimiter };
