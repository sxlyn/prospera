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

module.exports = { authLimiter, apiLimiter };
