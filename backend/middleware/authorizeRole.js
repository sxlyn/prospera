/**
 * authorizeRole.js — Middleware Otorisasi Berbasis Peran (RBAC)
 * Digunakan SETELAH verifyToken untuk memeriksa apakah pengguna
 * memiliki role yang diizinkan untuk mengakses endpoint tertentu.
 *
 * Contoh penggunaan di routes:
 *   router.get('/analytics', verifyToken, authorizeRole('owner'), getAnalytics);
 *   router.post('/checkout', verifyToken, authorizeRole('owner', 'karyawan'), createTransaction);
 */
const authorizeRole = (...allowedRoles) => {
    return (req, res, next) => {
        // req.user sudah diisi oleh verifyToken (dari JWT payload)
        if (!req.user || !req.user.role) {
            return res.status(403).json({
                message: "Akses ditolak. Data otorisasi tidak ditemukan."
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Akses ditolak. Anda tidak memiliki hak akses untuk fitur ini."
            });
        }

        next();
    };
};

module.exports = authorizeRole;
