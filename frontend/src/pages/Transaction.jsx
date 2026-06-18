import ErrorMessage from "../components/ErrorMessage"; 
import TransactionForm from "../components/Transaction/TransactionForm";
import CartTable from "../components/Transaction/CartTable";
import HistorySection from "../components/Transaction/HistorySection";
import TransactionDetailModal from "../components/Transaction/TransactionDetailModal";
import { useTransactionLogic } from "../hooks/useTransactionLogic"; 
import { printReceipt, getTransactionTypeLabel } from "../utils/transactionHelpers"; // <-- Panggil fungsi print

export default function Transaction() {
  const logic = useTransactionLogic();

  return (
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" }}>
          <div><h2>Transaction</h2></div>
        </div>

        {/* ERROR SERVER */}
        {logic.fetchError && (
          <div style={{ marginBottom: "16px" }}><ErrorMessage error={logic.fetchError} /></div>
        )}

        {/* NOTIFIKASI & TOMBOL CETAK STRUK */}
        {logic.message && (
          <div style={{ 
            padding: "12px 16px", borderRadius: "10px", 
            background: logic.messageType === "success" ? "#D1FAE5" : "#FEF3C7", 
            border: `1px solid ${logic.messageType === "success" ? "#10B981" : "#F59E0B"}`, 
            color: logic.messageType === "success" ? "#065F46" : "#92400E", 
            marginBottom: "16px", display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: "12px", fontWeight: "500"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <i className={`fas ${logic.messageType === "success" ? "fa-check-circle text-success" : "fa-exclamation-circle text-warning"} fs-5`}></i>
                <span>{logic.message}</span>
            </div>
            {/* Panggil fungsi printReceipt di sini */}
            {logic.messageType === "success" && logic.lastTransaction && (
                <button 
                    onClick={() => printReceipt(logic.lastTransaction)} 
                    style={{ padding: "6px 12px", background: "white", border: "1px solid #10B981", borderRadius: "6px", color: "#10B981", cursor: "pointer", fontWeight: "bold" }}
                >
                    <i className="fas fa-print me-2"></i>Cetak Struk
                </button>
            )}
          </div>
        )}

        {/* KOMPONEN UI */}
        <TransactionForm {...logic} />
        <CartTable {...logic} />
        
        {/* Helper getTransactionTypeLabel dikirim ke bawah biar gak error */}
        <HistorySection {...logic} getTransactionTypeLabel={getTransactionTypeLabel} />
        <TransactionDetailModal {...logic} getTransactionTypeLabel={getTransactionTypeLabel} />
        
      </div>
  );
}