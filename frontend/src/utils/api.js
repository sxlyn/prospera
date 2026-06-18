/**
 * api.js — Modul API Terpusat (Single Source of Truth)
 * Menangani semua komunikasi dengan backend, autentikasi,
 * dan manajemen sesi secara konsisten.
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ==================== MANAJEMEN SESI ====================

/**
 * Mengambil token JWT dari localStorage
 */
export const getToken = () => localStorage.getItem("token");

/**
 * Mengambil data user dari localStorage
 */
export const getCurrentUser = () => {
    try {
        return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
        return null;
    }
};

/**
 * Mengambil role user saat ini dari localStorage
 * SECURITY FIX (F-S10): Validasi role terhadap whitelist yang diizinkan.
 * Jika role di-manipulasi manual (misal: 'admin', 'superuser'), akan ditolak.
 * @returns {'owner'|'karyawan'|null}
 */
const ALLOWED_ROLES = ['owner', 'karyawan'];

export const getUserRole = () => {
    const user = getCurrentUser();
    const role = user?.role || null;
    // Tolak role yang tidak ada dalam whitelist
    if (role && !ALLOWED_ROLES.includes(role)) {
        console.error(`[Security] Role tidak dikenali: "${role}". Sesi dihapus.`);
        clearAuthSession();
        return null;
    }
    return role;
};

/**
 * Menyimpan sesi autentikasi (token + data user)
 */
export const setAuthSession = (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
};

/**
 * Menghapus seluruh sesi autentikasi
 */
export const clearAuthSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
};

/**
 * Memeriksa apakah token JWT masih valid (belum expired).
 * 
 * PENTING (F-T08): Ini adalah CLIENT-SIDE FAST-FAIL CHECK saja.
 * Fungsi ini BUKAN pengganti validasi keamanan di server.
 * - Tujuan: Mencegah API call yang pasti gagal (token expired/corrupt).
 * - Keamanan sebenarnya: Backend middleware (verifyToken + authorizeRole).
 * - Role/otorisasi: TIDAK pernah diandalkan dari decode JWT di client.
 *   Role dibaca dari localStorage (yang di-set saat login dari respons server).
 * 
 * @returns {boolean} true jika token ada, formatnya valid, dan belum expired
 */
export const isTokenValid = () => {
    const token = getToken();
    if (!token) return false;

    try {
        // SECURITY FIX (F-T07): Validasi struktur JWT (harus punya 3 bagian)
        const parts = token.split('.');
        if (parts.length !== 3) {
            console.error('[Security] Token JWT memiliki format yang tidak valid.');
            return false;
        }

        // Decode payload tanpa verifikasi signature (itu tugas backend)
        const payload = JSON.parse(atob(parts[1]));

        // Cek expiry
        const isExpired = payload.exp * 1000 < Date.now();
        if (isExpired) return false;

        // Validasi: payload harus memiliki field yang diharapkan
        if (!payload.id || !payload.role) {
            console.error('[Security] Token tidak memiliki payload yang diharapkan.');
            return false;
        }

        return true;
    } catch {
        // Token corrupt / format salah → anggap tidak valid
        return false;
    }
};

// ==================== FETCH WRAPPER TERPUSAT ====================

/**
 * Custom Error Class untuk membedakan error API (aman untuk UI)
 * dari runtime JS error (raw technical error).
 */
export class ApiError extends Error {
    constructor(message) {
        super(message);
        this.name = "ApiError";
    }
}

/**
 * apiFetch — Fungsi fetch terpusat untuk semua komunikasi API.
 * Menangani:
 *   - Penyisipan Authorization header secara otomatis
 *   - HTTP 401/403 → redirect ke login
 *   - HTTP 429 → pesan rate limit dari backend
 *   - Error generik untuk status lainnya
 *
 * @param {string} endpoint - Path API (misal: "/products")
 * @param {object} options  - Opsi fetch (method, body, headers, dll.)
 * @returns {Promise<any>}  - Data JSON dari response
 */
export const apiFetch = async (endpoint, options = {}) => {
    const token = getToken();
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    let response;
    try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });
    } catch (error) {
        // Log technical error for developers
        console.error(`[API Network Error] at ${endpoint}:`, error);
        throw new ApiError("Koneksi ke server terputus. Pastikan server aktif dan perangkat Anda terhubung ke internet.");
    }

    // --- HANDLER: Token expired ---
    if (response.status === 401) {
        if (!endpoint.includes("/auth/login") && window.location.pathname !== "/login") {
            clearAuthSession();
            window.location.href = "/login";
            throw new ApiError("Sesi Anda telah berakhir. Silakan login kembali untuk melanjutkan.");
        }
    }

    // --- HANDLER: Forbidden (RBAC) ---
    if (response.status === 403) {
        const data = await response.json().catch(() => ({}));
        console.error(`[API 403 Forbidden] at ${endpoint}:`, data);
        throw new ApiError("Anda tidak memiliki hak akses untuk fitur ini.");
    }

    // --- HANDLER: Rate Limit Exceeded ---
    if (response.status === 429) {
        const data = await response.json().catch(() => ({}));
        console.error(`[API 429 Rate Limit] at ${endpoint}:`, data);
        throw new ApiError("Terlalu banyak aktivitas. Silakan tunggu beberapa saat lalu coba lagi.");
    }

    // --- Parse response ---
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
        // Log technical error for developers
        console.error(`[API HTTP Error] ${response.status} at ${endpoint}:`, data || response.statusText);
        
        // Return user-friendly message
        if (response.status >= 500) {
            throw new ApiError("Terjadi gangguan pada sistem kami. Silakan coba lagi beberapa saat kemudian.");
        }
        
        // Return backend validation message if available (usually user-friendly like "Email sudah digunakan")
        throw new ApiError(data?.message || "Permintaan tidak dapat diproses. Silakan periksa kembali data Anda.");
    }

    return data;
};

/**
 * apiFetchBlob — Fetch khusus untuk download file (Excel, CSV).
 * Mengembalikan Blob, bukan JSON.
 *
 * @param {string} endpoint - Path API
 * @returns {Promise<Blob>}
 */
export const apiFetchBlob = async (endpoint) => {
    const token = getToken();
    const headers = {};

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    let response;
    try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers,
        });
    } catch (error) {
        console.error(`[API Network Error] at ${endpoint}:`, error);
        throw new ApiError("Koneksi ke server terputus. Pastikan server aktif dan perangkat Anda terhubung ke internet.");
    }

    if (response.status === 401 || response.status === 403) {
        clearAuthSession();
        window.location.href = "/login";
        throw new ApiError("Sesi Anda telah berakhir. Silakan login kembali untuk melanjutkan.");
    }

    if (response.status === 429) {
        const data = await response.json().catch(() => ({}));
        console.error(`[API 429 Rate Limit] at ${endpoint}:`, data);
        throw new ApiError("Terlalu banyak aktivitas. Silakan tunggu beberapa saat lalu coba lagi.");
    }

    if (!response.ok) {
        console.error(`[API HTTP Error] ${response.status} at ${endpoint}:`, response.statusText);
        throw new ApiError("Gagal mengunduh file dari server. Silakan coba lagi beberapa saat kemudian.");
    }

    return response.blob();
};

/**
 * formatError — Mengekstrak pesan error untuk UI.
 * Memastikan hanya pesan yang ramah pengguna (ApiError) yang dirender,
 * sementara raw JS/Runtime error akan di-log dan diganti dengan fallback.
 * 
 * @param {Error|any} error - Objek error dari catch block
 * @returns {string} - Pesan error bahasa Indonesia yang aman untuk UI
 */
export const formatError = (error) => {
    if (error instanceof ApiError) {
        return error.message;
    }
    // Log raw JS error untuk keperluan debugging developer
    console.error("[Runtime UI Error]:", error);
    return "Terjadi kendala teknis internal. Silakan muat ulang (refresh) halaman.";
};

export default API_BASE_URL;
