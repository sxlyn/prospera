# Prospera - Smart Economy & Business Analytics untuk UMKM

**Prospera** adalah platform *Smart Economy* berbasis Node.js yang dirancang khusus untuk memberdayakan Usaha Mikro, Kecil, dan Menengah (UMKM) melalui pemanfaatan analisis data yang cerdas. Prospera hadir layaknya asisten digital yang membantu pelaku UMKM untuk lebih memahami kondisi usaha mereka sehari-hari. Oleh karena itu, sistem ini tidak hanya sekadar mencatat barang masuk dan keluar. Prospera dibekali dengan berbagai fitur pintar, seperti kemampuan untuk melihat tren penjualan bulanan, hingga memprediksi potensi pendapatan di masa depan. Pada akhirnya, melalui kemudahan pembuatan laporan keuangan yang serba otomatis, Prospera diharapkan bisa benar-benar membantu UMKM untuk "naik kelas" dan lebih mandiri secara teknologi maupun finansial.

## Anggota Tim 
*   **** – NIM
*   **** – NIM
*   **** – NIM
*   **** – NIM
*   **** – NIM
---

## Panduan Setup (Instalasi & Menjalankan Server)

Pastikan **Node.js** dan **MySQL** sudah terinstal dan database lokal sudah dalam keadaan aktif sebelum memulai.

1. Lakukan `npm install` pada terminal untuk mengunduh dan menginstal seluruh dependensi (*library*) pendukung yang dibutuhkan oleh proyek ini agar sistem dapat beroperasi dengan baik. Daftar *library* utama yang digunakan meliputi: `bcryptjs`, `cors`, `dotenv`, `exceljs`, `express`, `jsonwebtoken`, `mysql2`, `sequelize`, serta alat *development* `nodemon` dan `sequelize-cli`.
2. Buat file `.env` di direktori utama (*root*) proyek dan salin konfigurasi di bawah ini untuk menyambungkan aplikasi *backend* dengan database MySQL lokal Anda:
   ```env
   # Konfigurasi Database Lokal 
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=prospera_db
   DB_PORT=3306
   JWT_SECRET=rahasia_123_jwt
   PORT=5000
   ```
3. Buat database baru di MySQL (misalnya melalui phpMyAdmin) dengan nama `prospera_db` sesuai dengan yang ditulis di file `.env`. Anda juga bisa melakukannya via terminal dengan perintah `npx sequelize-cli db:create`.
4. Lakukan perintah `npx sequelize-cli db:migrate` pada terminal untuk mengeksekusi skrip migrasi agar struktur tabel di database terbentuk secara otomatis.
5. Lakukan perintah `npx sequelize-cli db:seed:all` pada terminal untuk menyuntikkan data awal ke dalam database, termasuk akun user, data produk, dan 100 data transaksi untuk keperluan pengujian analitik.
6. Lakukan perintah `npm run dev` pada terminal untuk menghidupkan server aplikasi. Jika konfigurasi benar, terminal akan menampilkan pesan bahwa server telah berjalan di *port* 5000.

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
