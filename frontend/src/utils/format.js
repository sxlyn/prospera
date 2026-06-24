/**
 * formatRupiah — Format angka ke mata uang Rupiah Indonesia
 * STABILITY FIX (F-T09): Aman terhadap null, undefined, NaN, string kosong.
 * Sebelumnya: Math.round(undefined) = NaN → "Rp NaN" di 10+ komponen.
 * 
 * @param {number|string|null|undefined} value - Nilai yang akan diformat
 * @returns {string} Angka terformat (contoh: "Rp 1.500.000")
 */
export const formatRupiah = (value) => {
    const num = Number(value);
    if (value === null || value === undefined || value === '' || isNaN(num)) {
        return 'Rp 0';
    }
    return `Rp ${Math.round(num).toLocaleString('id-ID')}`;
};

/**
 * formatDatetime — Format tanggal/waktu dengan timezone Asia/Jakarta eksplisit
 * FIX (MEDIUM-FE-03): Standarisasi tampilan tanggal di seluruh aplikasi.
 *
 * Masalah sebelumnya: banyak komponen pakai `new Date().toLocaleString('id-ID')`
 * tanpa timezone → tampilan bergantung timezone browser/server → bisa salah 7 jam
 * ketika di-deploy ke cloud server UTC.
 *
 * @param {string|Date|null|undefined} value - Nilai tanggal yang akan diformat
 * @param {object} options - Override Intl.DateTimeFormat options (opsional)
 * @returns {string} Tanggal terformat dalam WIB (contoh: "24 Jun 2026, 10.30")
 */
export const formatDatetime = (value, options = {}) => {
    if (!value) return '-';
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return '-';

    const defaultOptions = {
        timeZone: 'Asia/Jakarta',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    };

    return new Intl.DateTimeFormat('id-ID', { ...defaultOptions, ...options }).format(date);
};

/**
 * formatDateOnly — Format hanya tanggal (tanpa jam), timezone WIB
 * @param {string|Date|null|undefined} value
 * @returns {string} contoh: "24 Jun 2026"
 */
export const formatDateOnly = (value) => {
    if (!value) return '-';
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return '-';

    return new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date);
};

