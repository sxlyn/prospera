/**
 * useHistory.js — Hook untuk manajemen riwayat transaksi
 * REFACTOR (F-T02): Dipecah dari god-hook useTransactionLogic.js
 * 
 * Bertanggung jawab atas:
 * - Fetch & state riwayat transaksi
 * - Pagination (page, totalPages, totalItems)
 * - Filter tanggal (ALL, TODAY, MONTH, CUSTOM)
 * - Filter tab (ALL, Penjualan, Pembelian)
 * - Search dalam riwayat
 * - Detail modal transaksi
 */

import { useState, useMemo } from "react";
import { apiFetch, apiFetchBlob, formatError, API_BASE_URL } from "../utils/api";
import { getTransactionTypeLabel } from "../utils/transactionHelpers";

export function useHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState(null);

    // Pagination
    const [historyPage, setHistoryPage] = useState(1);
    const [historyTotalPages, setHistoryTotalPages] = useState(1);
    const [historyTotalItems, setHistoryTotalItems] = useState(0);
    const historyLimit = 10;

    // Tab & Date Filter
    const [activeTab, setActiveTab] = useState("ALL");
    const [dateFilterType, setDateFilterType] = useState("ALL");
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");
    const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
    const [historySearchTerm, setHistorySearchTerm] = useState("");

    // Detail modal
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [showTransactionModal, setShowTransactionModal] = useState(false);

    // Report modal
    const [showReportModal, setShowReportModal] = useState(false);

    const fetchHistory = async (type = dateFilterType, start = customStartDate, end = customEndDate, page = 1) => {
        setLoading(true);
        try {
            let url = "/transactions/history";
            let queryParams = [`page=${page}`, `limit=${historyLimit}`];
            const today = new Date();

            if (type === "TODAY") {
                const offset = today.getTimezoneOffset() * 60000;
                const localDate = (new Date(today - offset)).toISOString().split('T')[0];
                queryParams.push(`start=${localDate}`);
                queryParams.push(`end=${localDate}`);
            } else if (type === "MONTH") {
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const lastDay = new Date(year, today.getMonth() + 1, 0).getDate();
                queryParams.push(`start=${year}-${month}-01`);
                queryParams.push(`end=${year}-${month}-${lastDay}`);
            } else if (type === "CUSTOM" && start && end) {
                queryParams.push(`start=${start}`);
                queryParams.push(`end=${end}`);
            }

            if (queryParams.length > 0) {
                url += `?${queryParams.join('&')}`;
            }

            const data = await apiFetch(url);
            if (data.transactions) {
                setHistory(data.transactions);
                setHistoryPage(data.currentPage);
                setHistoryTotalPages(data.totalPages);
                setHistoryTotalItems(data.totalItems);
            } else {
                setHistory(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            setFetchError(formatError(error));
        } finally {
            setLoading(false);
        }
    };

    const handleDateFilterChange = (type) => {
        setDateFilterType(type);
        if (type !== "CUSTOM") {
            setIsDateMenuOpen(false);
            setHistoryPage(1);
            fetchHistory(type, "", "", 1);
        }
    };

    const applyCustomDate = () => {
        setIsDateMenuOpen(false);
        setHistoryPage(1);
        fetchHistory("CUSTOM", customStartDate, customEndDate, 1);
    };

    const openTransactionModal = (transaction) => {
        setSelectedTransaction(transaction);
        setShowTransactionModal(true);
    };

    const closeTransactionModal = () => {
        setSelectedTransaction(null);
        setShowTransactionModal(false);
    };

    const handleExportExcel = async (start, end) => {
        try {
            let url = "/transactions/export";
            let queryParams = [];
            if (start && end) {
                queryParams.push(`start=${start}`);
                queryParams.push(`end=${end}`);
            }

            if (queryParams.length > 0) {
                url += `?${queryParams.join('&')}`;
            }

            // FIX (CRITICAL-FE-01 + CRITICAL-FE-02): Gunakan apiFetchBlob terpusat
            // dari api.js (bukan raw fetch). apiFetchBlob membaca token dari
            // sessionStorage dan menangani 401/403 secara konsisten.
            const blob = await apiFetchBlob(url);
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', `Laporan_Transaksi_${start || 'All'}_to_${end || 'All'}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            // Cleanup: bebaskan object URL dari memory setelah dipakai
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            setFetchError(formatError(error));
        }
    };

    // PERFORMANCE FIX (F-S19): Memoize filtered history (O(N×M) computation)
    const filteredHistory = useMemo(() => {
        return history.filter((tx) => {
            const matchTab = activeTab === "ALL" || getTransactionTypeLabel(tx) === activeTab;
            const matchSearch = tx.TransactionDetails?.some(item =>
                item.Product?.product_name?.toLowerCase().includes(historySearchTerm.toLowerCase())
            );
            return matchTab && (historySearchTerm === "" || matchSearch);
        });
    }, [history, activeTab, historySearchTerm]);

    return {
        history, loading, fetchError,
        historyPage, historyTotalPages, historyTotalItems, fetchHistory,
        activeTab, setActiveTab,
        dateFilterType, setDateFilterType, customStartDate, setCustomStartDate,
        customEndDate, setCustomEndDate,
        isDateMenuOpen, setIsDateMenuOpen,
        historySearchTerm, setHistorySearchTerm,
        selectedTransaction, showTransactionModal,
        handleDateFilterChange, applyCustomDate,
        openTransactionModal, closeTransactionModal,
        filteredHistory, handleExportExcel,
        showReportModal, setShowReportModal
    };
}
