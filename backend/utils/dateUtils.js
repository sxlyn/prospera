const { Op } = require("sequelize");

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

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        return {
            transaction_datetime: {
                [Op.between]: [start, end]
            }
        };
    }
    return {};
};

module.exports = { getDateFilter, isValidDate };