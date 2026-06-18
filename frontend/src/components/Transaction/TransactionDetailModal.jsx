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
          <table className="table-simple" style={{ width: "100%" }}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th>Produk</th>
                <th>Tipe</th>
                <th>Qty</th>
                <th>Modal</th>
                <th>Harga</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {selectedTransaction.TransactionDetails?.map((item) => (
                <tr key={item.detail_id}>
                  <td>{item.Product?.product_name || "-"}</td>
                  <td>
                      <span className={item.transaction_type?.toUpperCase() === "SELL" ? "badge safe" : "badge low"}>
                        {item.transaction_type?.toUpperCase() === "SELL" ? "Jual" : "Beli"}
                      </span>
                  </td>
                  <td>{item.quantity}</td>
                  <td>{formatRupiah(item.capital_cost)}</td>
                  <td>{formatRupiah(item.selling_price)}</td>
                  <td className="fw-bold">{formatRupiah(item.sub_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}