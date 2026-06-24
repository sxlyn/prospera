/**
 * privacy.js — Utilitas Kepatuhan Data Pribadi (UU PDP Indonesia)
 * FIX (HIGH-01): Implementasi Data Masking & Redaction sesuai UU PDP Pasal 20
 * (Prinsip Data Minimization — hanya tampilkan data yang benar-benar diperlukan)
 *
 * PRINSIP: Data sensitif TIDAK BOLEH dikirim ke client dalam format telanjang.
 * Fungsi-fungsi di sini harus digunakan di semua endpoint auth yang mengembalikan
 * data profil pengguna (login, createUser, getAllUsers, dll).
 */

/**
 * Topeng email — sembunyikan bagian lokal kecuali 2 karakter pertama dan 1 terakhir
 * Contoh: "nikitaho@gmail.com" → "ni****o@gmail.com"
 * Contoh: "ab@test.com"        → "a*@test.com"
 *
 * @param {string} email - Alamat email asli
 * @returns {string} Email yang sudah di-mask, atau string kosong jika input tidak valid
 */
const maskEmail = (email) => {
    if (!email || typeof email !== 'string') return '';
    const [local, domain] = email.split('@');
    if (!domain) return email; // bukan format email valid, kembalikan apa adanya
    if (local.length <= 2) {
        // Email sangat pendek: tampilkan 1 karakter pertama + mask sisanya
        return `${local[0]}${'*'.repeat(Math.max(local.length - 1, 1))}@${domain}`;
    }
    // Standar: 2 karakter pertama + mask + 1 karakter terakhir
    const visibleStart = local.slice(0, 2);
    const visibleEnd   = local.slice(-1);
    const maskLength   = Math.max(local.length - 3, 2); // minimal 2 bintang
    return `${visibleStart}${'*'.repeat(maskLength)}${visibleEnd}@${domain}`;
};

/**
 * Topeng nomor telepon — sembunyikan 4 digit tengah
 * Contoh: "081234567890" → "0812****7890"
 * Contoh: "+6281234567890" → "+6281****7890"
 *
 * @param {string} phone - Nomor telepon asli
 * @returns {string} Nomor yang sudah di-mask
 */
const maskPhone = (phone) => {
    if (!phone || typeof phone !== 'string') return '';
    const cleaned = phone.replace(/\s/g, '');
    if (cleaned.length < 8) return '****'; // terlalu pendek untuk di-mask dengan aman
    const visibleStart = cleaned.slice(0, 4);
    const visibleEnd   = cleaned.slice(-4);
    const maskLength   = Math.max(cleaned.length - 8, 4);
    return `${visibleStart}${'*'.repeat(maskLength)}${visibleEnd}`;
};

module.exports = { maskEmail, maskPhone };
