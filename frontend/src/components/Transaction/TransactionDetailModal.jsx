import React from 'react';
import { formatRupiah } from '../../utils/format';

export default function TransactionDetailModal({
  showTransactionModal, selectedTransaction, closeTransactionModal, getTransactionTypeLabel
}) {
  if (!showTransactionModal || !selectedTransaction) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
      <div style={{ width: "min(95%, 780px)", background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 16px 40px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <div>
            <h3>Detail Transaksi</h3>
            <p style={{ margin: 0, color: "#6B7280" }}>{selectedTransaction.transaction_datetime ? new Date(selectedTransaction.transaction_datetime).toLocaleString() : "-"}</p>
          </div>
          <button className="button" onClick={closeTransactionModal} style={{ background: "#EF4444", color: "white" }}>Tutup</button>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <strong>Total:</strong> {formatRupiah(selectedTransaction.total_amount)} • <strong>Tipe:</strong> {getTransactionTypeLabel(selectedTransaction)}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #E5E7EB" }}>
                <th style={{ padding: "10px" }}>Produk</th>
                <th style={{ padding: "10px" }}>Tipe</th>
                <th style={{ padding: "10px" }}>Qty</th>
                <th style={{ padding: "10px" }}>Modal</th>
                <th style={{ padding: "10px" }}>Harga</th>
                <th style={{ padding: "10px" }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {selectedTransaction.TransactionDetails?.map((item) => (
                <tr key={`${item.detail_id}-${item.product_id_fk}`}>
                  <td style={{ padding: "10px" }}>{item.Product?.product_name || "-"}</td>
                  <td style={{ padding: "10px" }}>{item.transaction_type?.toUpperCase() || "-"}</td>
                  <td style={{ padding: "10px" }}>{item.quantity}</td>
                  <td style={{ padding: "10px" }}>{formatRupiah(item.capital_cost)}</td>
                  <td style={{ padding: "10px" }}>{formatRupiah(item.selling_price)}</td>
                  <td style={{ padding: "10px", fontWeight: "600" }}>{formatRupiah(item.sub_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}