# Prospera - Smart Economy & Business Analytics untuk UMKM

**Prospera** adalah platform *Smart Economy* berbasis Node.js yang dirancang khusus untuk memberdayakan Usaha Mikro, Kecil, dan Menengah (UMKM) melalui pemanfaatan analisis data yang cerdas. Prospera hadir layaknya asisten digital yang membantu pelaku UMKM untuk lebih memahami kondisi usaha mereka sehari-hari. Oleh karena itu, sistem ini tidak hanya sekadar mencatat barang masuk dan keluar. Prospera dibekali dengan berbagai fitur pintar, seperti kemampuan untuk melihat tren penjualan bulanan, hingga memprediksi potensi pendapatan di masa depan. Pada akhirnya, melalui kemudahan pembuatan laporan keuangan yang serba otomatis, Prospera diharapkan bisa benar-benar membantu UMKM untuk "naik kelas" dan lebih mandiri secara teknologi maupun finansial.

## Anggota Tim 
*   **** – NIM
*   **** – NIM
*   **** – NIM
*   **** – NIM
*   **** – NIM
---

## Panduan Setup (Instalasi & Menjalankan Aplikasi)
sudah menyertakan `node_modules` dan file konfigurasi `.env`, sehingga Anda bisa langsung menjalankannya tanpa perlu menginstal dependensi tambahan. Pastikan **Node.js** dan **MySQL** sudah terinstal dan aktif.

buka **dua terminal** secara bersamaan (satu untuk Backend, satu untuk Frontend).

### Bagian A: Setup Database & Backend
1. Buat database baru di MySQL menggunakan file `db.sql` yang telah disediakan, atau jalankan perintah berikut di phpMyAdmin / MySQL CLI:
   `CREATE DATABASE prospera;`
   `CREATE DATABASE prospera_db;`
2. Lakukan migrasi tabel database dengan perintah:
   `npx sequelize-cli db:migrate`
3. Suntikkan data awal dengan perintah:
   `npx sequelize-cli db:seed:all`
4. Jalankan server backend:
   `npm run dev`
   *(Server akan berjalan di port 5000. Biarkan terminal ini tetap aktif).*

### Bagian B: Setup Tampilan (Frontend)
1. Buka terminal kedua, arahkan ke direktori frontend
2. Jalankan antarmuka aplikasi:
   `npm run dev`
3. Terminal akan menampilkan link lokal (umumnya `http://localhost:5173`). Klik link tersebut untuk membuka aplikasi Prospera.

## Struktur Proyek

Sistem *backend* ini dibangun dengan arsitektur MVC (Model-View-Controller) yang dimodifikasi untuk API (menggunakan Routes dan Controllers). Berikut adalah penjelasan struktur folder utamanya:
```
prospera-backend/
├── config/           # Konfigurasi koneksi database untuk ORM Sequelize (config.json)
├── controllers/      # Berisi logika utama (misal: perhitungan analitik, forecast, dan operasi CRUD)
├── middleware/       # Berisi lapisan keamanan (seperti verifikasi token JWT untuk memproteksi endpoint)
├── migrations/       # Skrip otomatisasi untuk pembuatan dan perubahan struktur tabel database
├── models/           # Definisi skema tabel menggunakan ORM Sequelize (User, Product, Transaction, dll)
├── routes/           # Daftar lengkap endpoint API (auth, products, transactions, analytics, forecast, inventory)
├── seeders/          # Skrip penyuntikan data awal (dummy data) untuk keperluan pengujian
├── services/         # Layanan tambahan dengan menerapkan konsep OOP
├── .env              # File konfigurasi variabel environment
└── server.js         # Entry point (titik awal) untuk menjalankan keseluruhan server aplikasi
```
## Akun Uji
Gunakan akun di bawah ini untuk melewati proses autentikasi (Login). Akun ini sudah otomatis terdaftar di database saat Anda mengeksekusi perintah *seeder*

*   **Email:** `prospera01@gmail.com`
*   **Password:** `password123`

---

## Daftar Endpoint Utama
Berikut adalah representasi *endpoint* lengkap berdasarkan *routing* yang tersedia di sistem untuk diuji

| Modul | Method | Endpoint | Deskripsi |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/register` | Mendaftarkan user baru |
| **Auth** | `POST` | `/api/auth/login` | Login user  untuk mendapatkan Bearer Token |
| **Products** | `GET` | `/api/products` | Menampilkan seluruh data produk |
| **Products** | `GET` | `/api/products/:id` | Menampilkan detail spesifik dari satu produk (berdasarkan ID) |
| **Products** | `POST` | `/api/products` | Menambahkan data produk baru ke inventaris |
| **Transactions** | `GET` | `/api/transactions/history` | Menampilkan riwayat transaksi kasir |
| **Transactions** | `POST` | `/api/transactions/checkout` | Memproses transaksi/pembelian baru |
| **Analytics** | `GET` | `/api/analytics/summary` | Ringkasan analitik bisnis *(Mendukung filter query: `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`)* |
| **Analytics** | `GET` | `/api/analytics/summary/export` | Mengunduh (export) data laporan analitik ke format Excel/CSV |
| **Analytics** | `GET` | `/api/analytics/profit` | Menampilkan metrik keuntungan/laba *(Mendukung filter query tanggal)* |
| **Analytics** | `GET` | `/api/analytics/monthly` | Menampilkan rekapitulasi data tren bulanan *(Mendukung filter query tanggal)* |
| **Analytics** | `GET` | `/api/analytics/top-product` | Menampilkan produk terlaris *(Mendukung filter query: `?limit=5`)* |
| **Forecast** | `GET` | `/api/forecast` | Memprediksi tren penjualan harian ke depan menggunakan data historis (mengambil data 7 hari terakhir) |
| **Inventory** | `GET` | `/api/inventory/low-stock` | Mengecek daftar barang/produk yang stoknya sudah hampir habis (<=25)|

*(Catatan: Selain endpoint `/api/auth/register` dan `/api/auth/login`, seluruh endpoint di atas diwajibkan menyertakan Bearer Token pada Headers untuk alasan keamanan).*
