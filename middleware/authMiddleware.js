const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // 1. Tangkap header "Authorization" dari request
    const authHeader = req.headers['authorization'];
    
    // 2. Pisahkan kata "Bearer" dari tokennya
    const token = authHeader && authHeader.split(' ')[1]; 

    // 3. Jika tidak ada token sama sekali, tolak!
    if (!token) {
        return res.status(401).json({ message: "Akses ditolak! Anda belum login (Token tidak ada)." });
    }

    // 4. Verifikasi keaslian token menggunakan JWT_SECRET
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            // Membedakan jenis error supaya lebih mudah ditangani
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: "Sesi Anda telah habis. Silakan login kembali." });
            } else if (err.name === 'JsonWebTokenError') {
                return res.status(403).json({ message: "Token tidak valid atau telah dimanipulasi!" });
            } else {
                return res.status(403).json({ message: "Gagal memverifikasi token." });
            }
        }
        
        // 5. Jika valid, simpan data user (termasuk user_id) ke dalam req.user
        req.user = decoded; 
        
        // 6. Izinkan masuk ke rute tujuan (Controller)
        next(); 
    });
};

module.exports = verifyToken;