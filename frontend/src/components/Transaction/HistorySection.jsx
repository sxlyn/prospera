import React from 'react';
import { formatRupiah } from '../../utils/format';

export default function HistorySection({
  historySearchTerm, setHistorySearchTerm, activeTab, setActiveTab,
  dateFilterType, isDateMenuOpen, setIsDateMenuOpen,
  handleDateFilterChange, customStartDate, setCustomStartDate,
  customEndDate, setCustomEndDate, applyCustomDate,
  loading, filteredHistory, getTransactionTypeLabel, openTransactionModal,
  historyPage, historyTotalPages, historyTotalItems, fetchHistory
}) {
  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
        <h3 style={{ margin: 0 }}>Riwayat Transaksi</h3>
        
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          
          <input 
            className="input" 
            placeholder="🔍 Cari produk..." 
            style={{ width: "200px", padding: "6px 12px" }}
            value={historySearchTerm}
            onChange={(e) => setHistorySearchTerm(e.target.value)}
          />

          <div style={{ display: "flex", gap: "8px", background: "#F3F4F6", padding: "4px", borderRadius: "10px" }}>
            <button onClick={() => setActiveTab("ALL")} style={{ padding: "6px 16px", border: "none", background: activeTab === "ALL" ? "white" : "transparent", color: activeTab === "ALL" ? "#1F2937" : "#6B7280", borderRadius: "8px", fontWeight: "600", cursor: "pointer", boxShadow: activeTab === "ALL" ? "0 1px 3px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s" }}>Semua</button>
            <button onClick={() => setActiveTab("SELL")} style={{ padding: "6px 16px", border: "none", background: activeTab === "SELL" ? "#22C55E" : "transparent", color: activeTab === "SELL" ? "white" : "#6B7280", borderRadius: "8px", fontWeight: "600", cursor: "pointer", boxShadow: activeTab === "SELL" ? "0 1px 3px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s" }}>Penjualan</button>
            <button onClick={() => setActiveTab("BUY")} style={{ padding: "6px 16px", border: "none", background: activeTab === "BUY" ? "#EF4444" : "transparent", color: activeTab === "BUY" ? "white" : "#6B7280", borderRadius: "8px", fontWeight: "600", cursor: "pointer", boxShadow: activeTab === "BUY" ? "0 1px 3px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s" }}>Restock</button>
          </div>

          <div style={{ position: "relative" }}>
            <button 
              onClick={() => setIsDateMenuOpen(!isDateMenuOpen)}
              className="button"
              style={{ background: "white", color: "#374151", border: "1px solid #D1D5DB", display: "flex", alignItems: "center", gap: "8px", padding: "6px 16px" }}
            >
              📅 {dateFilterType === "ALL" ? "Semua Waktu" : dateFilterType === "TODAY" ? "Hari Ini" : dateFilterType === "MONTH" ? "Bulan Ini" : "Kustom"}
            </button>

            {isDateMenuOpen && (
              <div style={{ position: "absolute", top: "100%", right: 0, marginTop: "8px", background: "white", border: "1px solid #E5E7EB", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", zIndex: 50, width: "220px", padding: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <button onClick={() => handleDateFilterChange("ALL")} style={{ textAlign: "left", padding: "8px 12px", background: dateFilterType === "ALL" ? "#F3F4F6" : "transparent", border: "none", borderRadius: "6px", cursor: "pointer" }}>Semua Waktu</button>
                  <button onClick={() => handleDateFilterChange("TODAY")} style={{ textAlign: "left", padding: "8px 12px", background: dateFilterType === "TODAY" ? "#F3F4F6" : "transparent", border: "none", borderRadius: "6px", cursor: "pointer" }}>Hari Ini</button>
                  <button onClick={() => handleDateFilterChange("MONTH")} style={{ textAlign: "left", padding: "8px 12px", background: dateFilterType === "MONTH" ? "#F3F4F6" : "transparent", border: "none", borderRadius: "6px", cursor: "pointer" }}>Bulan Ini</button>
                  <button onClick={() => setDateFilterType("CUSTOM")} style={{ textAlign: "left", padding: "8px 12px", background: dateFilterType === "CUSTOM" ? "#F3F4F6" : "transparent", border: "none", borderRadius: "6px", cursor: "pointer" }}>Pilih Manual...</button>
                </div>

                {dateFilterType === "CUSTOM" && (
                  <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #E5E7EB", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div>
                      <label style={{ fontSize: "12px", color: "#6B7280", display: "block", marginBottom: "4px" }}>Dari:</label>
                      <input type="date" className="input" style={{ width: "100%", padding: "6px 8px" }} value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: "#6B7280", display: "block", marginBottom: "4px" }}>Sampai:</label>
                      <input type="date" className="input" style={{ width: "100%", padding: "6px 8px" }} value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} />
                    </div>
                    <button className="button" style={{ width: "100%", padding: "8px", fontSize: "13px", marginTop: "4px" }} onClick={applyCustomDate}>
                      Terapkan
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <p>Loading history...</p>
      ) : filteredHistory.length === 0 ? (
        <p style={{ color: "#6B7280", textAlign: "center", padding: "20px 0" }}>Belum ada transaksi tersimpan untuk rentang/kategori ini.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #E5E7EB" }}>
                <th style={{ padding: "10px" }}>Tanggal</th>
                <th style={{ padding: "10px" }}>Total</th>
                <th style={{ padding: "10px" }}>Tipe</th>
                <th style={{ padding: "10px" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((tx) => {
                const txType = getTransactionTypeLabel(tx);
                return (
                  <tr key={tx.transaction_id}>
                    <td style={{ padding: "10px" }}>{tx.transaction_datetime ? new Date(tx.transaction_datetime).toLocaleString() : "-"}</td>
                    <td style={{ padding: "10px", fontWeight: "500" }}>{formatRupiah(tx.total_amount)}</td>
                    <td style={{ padding: "10px" }}>
                      <span className={`badge ${txType === "SELL" ? "safe" : txType === "BUY" ? "low" : ""}`} style={txType === "MIXED" ? { background: "#E5E7EB", color: "#374151" } : { padding: "4px 10px", fontSize: "12px" }}>
                        {txType}
                      </span>
                    </td>
                    <td style={{ padding: "10px" }}>
                      <button className="button" style={{ padding: "6px 12px", fontSize: "13px" }} onClick={() => openTransactionModal(tx)}>Detail</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {historyTotalPages > 1 && !historySearchTerm && activeTab === "ALL" && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", borderTop: "1px solid #e5e7eb", paddingTop: "15px" }}>
              <span style={{ fontSize: "14px", color: "gray" }}>
                Menampilkan halaman {historyPage} dari {historyTotalPages} ({historyTotalItems} riwayat)
              </span>
              <div style={{ display: "flex", gap: "10px" }}>
                <button 
                  className="btn btn-outline-primary btn-sm" 
                  disabled={historyPage === 1}
                  onClick={() => fetchHistory(dateFilterType, customStartDate, customEndDate, historyPage - 1)}
                  style={{ borderRadius: "6px", padding: "5px 12px" }}
                >
                  <i className="fas fa-chevron-left me-1"></i> Prev
                </button>
                <button 
                  className="btn btn-outline-primary btn-sm" 
                  disabled={historyPage === historyTotalPages}
                  onClick={() => fetchHistory(dateFilterType, customStartDate, customEndDate, historyPage + 1)}
                  style={{ borderRadius: "6px", padding: "5px 12px" }}
                >
                  Next <i className="fas fa-chevron-right ms-1"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}