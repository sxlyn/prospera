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
