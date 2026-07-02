const { Op } = require("sequelize");
const moment = require("moment-timezone"); // FIX (BUG-07): Dibutuhkan oleh getDateFilter untuk WIB-aware date range

/**
 * SECURITY FIX (B-T12): Validasi format tanggal sebelum new Date().
 * Regex memastikan format YYYY-MM-DD diterima (valid ISO date string).
 * Mencegah injeksi string acak atau format tanggal tak terduga.
 */
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const isValidDate = (dateStr) => {
    if (!dateStr || !DATE_REGEX.test(dateStr)) return false;
    const d = new Date(dateStr);
    return !isNaN(d.getTime());
};

const getDateFilter = (startDate, endDate) => {
    if (startDate && endDate) {
        // Validasi format sebelum diproses
        if (!isValidDate(startDate) || !isValidDate(endDate)) {
            return {}; // Abaikan filter jika format invalid
        }

        // FIX (BUG-07): Ganti setHours() yang timezone-naif dengan moment-timezone WIB.
        // SEBELUMNYA: new Date(dateStr).setHours(0,0,0,0) menggunakan timezone SERVER (UTC),
        //             sehingga 00:00 WIB = 17:00 UTC hari sebelumnya \u2014 data transaksi antara
        //             00:00\u201306:59 WIB terlewat karena dianggap berada di hari kemarin.
        // SESUDAH   : Konsisten dengan buildWIBDateRange di bawah \u2014 single source of truth.
        const start = moment.tz(startDate + ' 00:00:00', 'YYYY-MM-DD HH:mm:ss', 'Asia/Jakarta').toDate();
        const end   = moment.tz(endDate   + ' 23:59:59', 'YYYY-MM-DD HH:mm:ss', 'Asia/Jakarta').toDate();

        return {
            transaction_datetime: {
                [Op.between]: [start, end]
            }
        };
    }
    return {};
};

/**
 * FIX (L1-02): Bangun rentang tanggal yang presisi untuk query InventoryLog.createdAt
 * dengan timezone Asia/Jakarta (WIB).
 *
 * Masalah: `new Date('2026-06-24' + 'T00:00:00')` di server UTC cloud akan terbaca
 * sebagai 00:00 UTC (= 07:00 WIB) — sehingga melewatkan event 00:00–07:00 WIB.
 *
 * Solusi: Pakai moment-timezone untuk konstruksi boundary yang eksplisit WIB,
 * lalu konversi ke Date object untuk Sequelize.
 *
 * @param {string|undefined} startDate - Format YYYY-MM-DD
 * @param {string|undefined} endDate   - Format YYYY-MM-DD
 * @returns {{ [Op.gte]: Date, [Op.lte]: Date }|undefined}
 */
const buildWIBDateRange = (startDate, endDate) => {
    if (!startDate && !endDate) return undefined;

    const range = {};
    if (startDate && isValidDate(startDate)) {
        // 00:00:00.000 WIB pada hari startDate
        range[Op.gte] = moment.tz(startDate + ' 00:00:00', 'YYYY-MM-DD HH:mm:ss', 'Asia/Jakarta').toDate();
    }
    if (endDate && isValidDate(endDate)) {
        // 23:59:59.999 WIB pada hari endDate
        range[Op.lte] = moment.tz(endDate + ' 23:59:59', 'YYYY-MM-DD HH:mm:ss', 'Asia/Jakarta').toDate();
    }
    return range;
};

module.exports = { getDateFilter, buildWIBDateRange };