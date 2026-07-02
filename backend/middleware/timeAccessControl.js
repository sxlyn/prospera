const moment = require('moment-timezone');
const bcrypt = require('bcryptjs');
const { User, StoreSettings } = require('../models');

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

        // Jika fitur lembur (global) sedang aktif, izinkan transaksi
        if (settings.is_overtime_active) {
            return next();
        }

        // --- CEK OVERTIME UNLOCKED UNTIL (BACKEND-DRIVEN SESSION) ---
        // FIX (BUG-OT-01): Gunakan req.user.user_id bukan req.user.id.
        // JWT payload menyimpan field user_id — req.user.id selalu undefined,
        // sehingga findByPk(undefined) selalu mengembalikan null dan sesi lembur
        // tidak pernah terdeteksi meski sudah berhasil di-unlock via PIN.
        const userId = req.user.user_id || req.user.id;
        const user = await User.findByPk(userId);
        if (user && user.overtime_unlocked_until) {
            const unlockedUntil = moment(user.overtime_unlocked_until);
            if (moment().isBefore(unlockedUntil)) {
                return next(); // Sesi lembur masih aktif
            }
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

        // FIX (BUG-A07): Refactor isTooEarly + isTooLate menjadi satu blok kondisional.
        // SEBELUMNYA: isTooEarly dihitung di luar kondisi — untuk skenario lintas-hari
        //             (misal buka 18:00, tutup 02:00), karyawan jam 01:00 WIB ditolak
        //             karena isTooEarly = true (01:00 < 18:00) walau masih dalam jam kerja.
        // SESUDAH   : Dua jalur terpisah (normal vs lintas-hari) masing-masing menghitung
        //             kedua variabel secara independen dan benar.
        let isTooEarly = false;
        let isTooLate  = false;

        if (openHour <= closeHourWithGrace) {
            // Jam NORMAL: buka dan tutup di hari yang sama (misal 08:00 – 22:30)
            isTooEarly = currentTime < openHour;
            isTooLate  = currentTime > closeHourWithGrace;
        } else {
            // Jam LINTAS HARI: tutup setelah tengah malam (misal buka 18:00, tutup 02:00)
            // Akses DITOLAK hanya jika berada di antara jam tutup dan jam buka:
            // yaitu currentTime > closeHourWithGrace DAN currentTime < openHour
            // (misal jam 03:00 – 17:59 pada contoh di atas)
            if (currentTime > closeHourWithGrace && currentTime < openHour) {
                isTooLate = true; // Di luar jam operasional lintas-hari
            }
            // isTooEarly tetap false — tidak relevan untuk skenario lintas-hari
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
