require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { sequelize } = require('./models');
const { apiLimiter } = require('./middleware/rateLimiter');
const { CORS_ORIGIN, BODY_SIZE_LIMIT } = require('./config/appConfig');

// --- Fail-fast: Validasi konfigurasi kritis sebelum server berjalan ---
if (!process.env.JWT_SECRET) {
    console.error('\n❌ FATAL ERROR: JWT_SECRET belum dikonfigurasi di file .env!');
    console.error('   Server tidak dapat berjalan tanpa kunci rahasia JWT.\n');
    process.exit(1);
}

// SECURITY FIX (B-T01): Tolak JWT_SECRET yang terlalu lemah/pendek
// Minimum 32 karakter (128-bit entropy) untuk mencegah brute-force
if (process.env.JWT_SECRET.length < 32) {
    console.error('\n❌ FATAL ERROR: JWT_SECRET terlalu lemah! Minimal 32 karakter.');
    console.error('   Generate secret baru: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"\n');
    process.exit(1);
}

const app = express();

// ===== LAPISAN KEAMANAN (Security Middleware Stack) =====

// Layer 1: Helmet — Menyembunyikan identitas server & mencegah serangan injeksi header
app.use(helmet());

// Layer 2: CORS — Membatasi akses hanya dari origin yang diizinkan
app.use(cors({
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Layer 3: Rate Limiter Global — Anti DDoS untuk seluruh endpoint API
app.use('/api', apiLimiter);

// Layer 4: Body Parser — Membatasi ukuran payload untuk mencegah serangan payload besar
app.use(express.json({ limit: BODY_SIZE_LIMIT }));

// ===== RUTE APLIKASI =====

// Mengimpor rute aplikasi
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const forecastRoutes = require('./routes/forecastRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

// Mendaftarkan rute antarmuka pemrograman aplikasi ke dalam server
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/categories', categoryRoutes);

// Rute pengujian server
app.get('/', (req, res) => {
    res.status(200).json({ message: "Server Backend Prospera berjalan dengan baik." });
});

// ===== PENANGANAN ERROR =====

// Penanganan Rute Tidak Ditemukan (404 Handler)
// SECURITY FIX (B-S02): Tidak lagi menampilkan req.originalUrl ke client (information disclosure)
app.use((req, res) => {
    res.status(404).json({ message: "Endpoint yang Anda akses tidak tersedia." });
});

// Penanganan Kesalahan Global (500 Handler) — Sentral & Aman
// Menangkap semua error yang dilempar via next(error) dari Controller
app.use((err, req, res, next) => {
    // Log detail error ke terminal server (untuk debugging internal)
    console.error(`[${new Date().toISOString()}] Kesalahan Fatal Sistem:`);
    console.error(`  Route: ${req.method} ${req.originalUrl}`);
    console.error(`  Pesan: ${err.message}`);
    console.error(`  Stack: ${err.stack}`);

    // Kirim respons generik ke client (TIDAK membocorkan detail error)
    res.status(err.statusCode || 500).json({ 
        message: err.isOperational 
            ? err.message 
            : "Terjadi kesalahan internal sistem yang tidak terduga." 
    });
});

// ===== KONEKSI DATABASE & START SERVER =====

const PORT = process.env.PORT || 5000;

sequelize.authenticate()
    .then(() => {
        console.log('Koneksi ke basis data MySQL (Sequelize) berhasil didirikan.');
        const server = app.listen(PORT, () => {
            console.log(`Server Node.js berjalan pada port ${PORT}`);
            console.log(`Helmet aktif | CORS dibatasi ke: ${CORS_ORIGIN}`);
            console.log(`Rate limiter aktif | Body limit: ${BODY_SIZE_LIMIT}`);
        });

        // PERFORMANCE FIX (B-S01): Graceful Shutdown
        // Memastikan koneksi DB ditutup dengan benar saat server dimatikan
        const gracefulShutdown = (signal) => {
            console.log(`\n⚠️  Sinyal ${signal} diterima. Memulai graceful shutdown...`);
            server.close(() => {
                console.log('✅ Server HTTP ditutup.');
                sequelize.close()
                    .then(() => {
                        console.log('✅ Koneksi database ditutup.');
                        process.exit(0);
                    })
                    .catch((err) => {
                        console.error('❌ Gagal menutup koneksi database:', err);
                        process.exit(1);
                    });
            });

            // Force shutdown setelah 10 detik jika graceful gagal
            setTimeout(() => {
                console.error('❌ Graceful shutdown timeout. Force exit.');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    })
    .catch((err) => {
        console.error('Gagal terhubung ke basis data:', err);
    });