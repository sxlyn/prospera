/**
 * requestId.js — Middleware Correlation ID (Enterprise Observability)
 *
 * Menyuntikkan X-Request-ID unik ke setiap request masuk.
 * Berguna untuk:
 *   - Melacak request di log lintas-service
 *   - Memudahkan debugging: "cari error dengan X-Request-ID: abc123"
 *   - Standar enterprise (Google Cloud, AWS ALB, dan Nginx semuanya pakai ini)
 *
 * Perilaku:
 *   - Jika client sudah mengirim X-Request-ID header, header itu DIPAKAI (idempotent)
 *   - Jika tidak, generate UUID baru
 *   - Header ini SELALU dikembalikan ke client dalam response
 */
const { randomUUID } = require('crypto');

const requestId = (req, res, next) => {
    // Gunakan header yang sudah ada (dari load balancer/gateway) atau generate baru
    const id = req.headers['x-request-id'] || randomUUID();

    // Simpan ke req agar bisa dipakai controller/logger downstream
    req.requestId = id;

    // Kembalikan ke client agar bisa di-trace dari sisi frontend
    res.setHeader('X-Request-Id', id);

    next();
};

module.exports = requestId;
