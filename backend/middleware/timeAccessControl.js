const moment = require('moment-timezone');
const bcrypt = require('bcryptjs');
const { StoreSettings } = require('../models');

// Gunakan timezone default Indonesia, atau ambil dari .env
const TIMEZONE = process.env.TIMEZONE || 'Asia/Jakarta';

exports.checkTimeAccess = async (req, res, next) => {
    try {
        // Aturan ini hanya difokuskan untuk peran karyawan (kasir).
        // Owner memiliki akses tak terbatas ke sistem transaksi.
        if (req.user.role === 'owner') {
            return next();
        }

        const ownerId = req.user.owner_id;
        if (!ownerId) {
            return res.status(403).json({ message: "Akses ditolak. Profil karyawan tidak valid." });
        }

        // Ambil pengaturan toko
        const settings = await StoreSettings.findOne({ where: { user_id_fk: ownerId } });
        
        // Jika owner belum pernah mengatur, izinkan transaksi secara default (MVP friendly)
        if (!settings) {
            return next();
        }

        // --- CEK EMERGENCY PIN (BYPASS) ---
        // Jika frontend mengirimkan emergency_pin di payload
        if (req.body.emergency_pin && settings.emergency_pin) {
            const isPinValid = await bcrypt.compare(req.body.emergency_pin, settings.emergency_pin);
            if (isPinValid) {
                return next(); // Lolos karena PIN darurat valid
            } else {
                return res.status(401).json({ message: "PIN Darurat salah." });
            }
        }

        // Jika fitur lembur sedang aktif, izinkan transaksi
        if (settings.is_overtime_active) {
            return next();
        }

        // --- VALIDASI WAKTU ---
        const now = moment().tz(TIMEZONE);
        const currentTime = now.format('HH:mm:ss');
        
        const openHour = settings.open_hour; // Format: "08:00:00"
        
        // Hitung batas waktu tutup (close_hour + grace_period_minutes)
        // Kita parsing close_hour menjadi objek moment hari ini, lalu tambah menit
        const closeMoment = moment.tz(`${now.format('YYYY-MM-DD')} ${settings.close_hour}`, 'YYYY-MM-DD HH:mm:ss', TIMEZONE);
        closeMoment.add(settings.grace_period_minutes, 'minutes');
        
        const closeHourWithGrace = closeMoment.format('HH:mm:ss');

        // Pengecekan:
        // Apakah waktu sekarang KURANG dari open_hour?
        const isTooEarly = currentTime < openHour;
        
        // Apakah waktu sekarang LEBIH dari close_hour + grace_period?
        // Catatan: Jika toko buka sampai lewat tengah malam (misal tutup jam 02:00 pagi), logika komparasi string sederhana bisa bermasalah.
        // Untuk standar UMKM (Buka Pagi, Tutup Malam di hari yang sama), komparasi string jam sudah cukup akurat.
        let isTooLate = false;
        
        if (openHour <= closeHourWithGrace) {
            // Jam normal (misal buka 08:00, tutup 22:30)
            isTooLate = currentTime > closeHourWithGrace;
        } else {
            // Jam lintas hari (misal buka 18:00, tutup 02:00)
            if (currentTime >= openHour || currentTime <= closeHourWithGrace) {
                // Di dalam jam kerja lintas hari (isTooLate = false)
                isTooLate = false;
                // isTooEarly juga harus di reset karena ini lintas hari
                if (currentTime >= openHour || currentTime <= closeHourWithGrace) {
                    // Berarti aman
                }
            } else {
                isTooLate = true; // Berada di antara jam tutup dan jam buka
            }
        }

        if (isTooEarly || isTooLate) {
            return res.status(403).json({ 
                message: "Toko sedang tutup. Transaksi tidak diizinkan di luar jam operasional.",
                require_pin: settings.emergency_pin ? true : false 
            });
        }

        next();
    } catch (error) {
        console.error("Error in timeAccessControl middleware:", error);
        return res.status(500).json({ message: "Kesalahan server saat memverifikasi akses waktu." });
    }
};
