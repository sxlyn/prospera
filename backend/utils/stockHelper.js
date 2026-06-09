// --- SINGLE SOURCE OF TRUTH (Pusat Aturan Stok) ---

// Sesuai data Fitur Pintar lu, kita sepakati batas kritis adalah 30 unit
const CRITICAL_THRESHOLD = 30; 

/**
 * Fungsi untuk menentukan status stok berdasarkan jumlahnya
 * @param {number} stock 
 * @returns {string} 'Low Stock' | 'Safe'
 */
const getStockStatus = (stock) => {
    return Number(stock) <= CRITICAL_THRESHOLD ? "Low Stock" : "Safe";
};

module.exports = {
    CRITICAL_THRESHOLD,
    getStockStatus
};