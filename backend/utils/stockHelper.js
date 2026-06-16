/**
 * stockHelper.js — Fungsi Pembantu Stok
 * REFACTOR (B-T13): CRITICAL_THRESHOLD sekarang dibaca dari appConfig.js (Single Source of Truth).
 * Sebelumnya: Hardcode 30 di file ini DAN di appConfig.js — berisiko tidak sinkron.
 */

const { CRITICAL_THRESHOLD } = require('../config/appConfig');

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