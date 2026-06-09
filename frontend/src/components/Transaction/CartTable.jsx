import React from 'react';
import { formatRupiah } from '../../utils/format';

export default function CartTable({
  cartItems, removeItem, setCartItems, saveTransaction, saving, totalAmount
}) {
  return (
    <div className="card" style={{ marginBottom: "24px" }}>
      <h3>Keranjang Transaksi</h3>
      {cartItems.length === 0 ? (
        <p style={{ color: "#6B7280" }}>Belum ada item transaksi.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #E5E7EB" }}>
                <th style={{ padding: "10px" }}>Nama Produk</th>
                <th style={{ padding: "10px" }}>Quantity</th>
                <th style={{ padding: "10px" }}>Modal</th>
                <th style={{ padding: "10px" }}>Harga</th>
                <th style={{ padding: "10px" }}>Tipe</th>
                <th style={{ padding: "10px" }}>Datetime</th>
                <th style={{ padding: "10px" }}>Subtotal</th>
                <th style={{ padding: "10px" }}></th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item, index) => {
                // FIX: Subtotal berdasarkan tipe transaksi (selaras dengan backend)
                const subtotal = item.transactionType === 'buy'
                  ? item.modal * item.quantity      // Pembelian: pakai harga modal
                  : item.hargaJual * item.quantity;  // Penjualan: pakai harga jual

                return (
                  <tr key={`${item.product_id}-${index}`}>
                    <td style={{ padding: "10px" }}>{item.product_name}</td>
                    <td style={{ padding: "10px" }}>{item.quantity}</td>
                    <td style={{ padding: "10px" }}>{formatRupiah(item.modal)}</td>
                    <td style={{ padding: "10px" }}>{formatRupiah(item.hargaJual)}</td>
                    <td style={{ padding: "10px" }}>
                      <span className={`badge ${item.transactionType === "buy" ? "safe" : "low"}`} style={{ padding: "2px 8px", fontSize: "12px" }}>
                        {item.transactionType === "buy" ? "Buy" : "Sell"}
                      </span>
                    </td>
                    <td style={{ padding: "10px" }}>{item.datetime ? new Date(item.datetime).toLocaleString() : "-"}</td>
                    <td style={{ padding: "10px", fontWeight: "600" }}>{formatRupiah(subtotal)}</td>
                    <td style={{ padding: "10px" }}>
                      <button className="button" style={{ background: "#EF4444", color: "white" }} onClick={() => removeItem(index)}>Hapus</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", flexWrap: "wrap", gap: "12px" }}>
        <div><strong>Total:</strong> {formatRupiah(totalAmount)}</div>
        
        <div style={{ display: "flex", gap: "12px" }}>
            <button 
                className="button" 
                style={{ background: "transparent", color: "#EF4444", border: "1px solid #EF4444", opacity: cartItems.length === 0 ? 0.5 : 1, cursor: cartItems.length === 0 ? "not-allowed" : "pointer" }} 
                onClick={() => setCartItems([])} 
                disabled={saving || cartItems.length === 0}
            >
                Kosongkan Keranjang
            </button>
            <button className="button" onClick={saveTransaction} disabled={saving || cartItems.length === 0}>
              {saving ? "Menyimpan..." : "Simpan Transaksi"}
            </button>
        </div>
      </div>
    </div>
  );
}