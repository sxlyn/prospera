
export default function TransactionForm({
  searchTerm, setSearchTerm, isDropdownOpen, setIsDropdownOpen,
  filteredProducts, selectedProductId, setSelectedProductId,
  transactionType, setTransactionType, quantity, setQuantity,
  modal, setModal, hargaJual, setHargaJual, datetime, setDatetime,
  addItem
}) {
  return (
    <div className="card" style={{ marginBottom: "24px" }}>
      <h3>Tambah Item Transaksi</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px", alignItems: "end" }}>
          
          <div style={{ position: "relative" }}>
            <label style={{ display: "block", marginBottom: "6px" }}>Pilih Produk</label>
            <input
              className="input"
              type="text"
              placeholder="Ketik untuk mencari produk..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsDropdownOpen(true);
                if (e.target.value === "") setSelectedProductId(""); 
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
              style={{ width: "100%" }}
            />
            
            {isDropdownOpen && (
              <ul style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid #ced4da", borderRadius: "8px", maxHeight: "250px", overflowY: "auto", zIndex: 10, listStyle: "none", padding: 0, margin: "4px 0 0 0", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <li
                      key={product.product_id}
                      style={{ padding: "10px 16px", cursor: "pointer", borderBottom: "1px solid #f3f4f6", backgroundColor: selectedProductId === product.product_id ? "#eef2ff" : "white" }}
                      onMouseDown={(e) => e.preventDefault()} 
                      onClick={() => {
                        setSelectedProductId(product.product_id);
                        setSearchTerm(product.product_name);
                        setIsDropdownOpen(false);
                      }}
                    >
                      {product.product_name} (Stok: {product.product_stock})
                    </li>
                  ))
                ) : (
                  <li style={{ padding: "10px 16px", color: "#6B7280", fontStyle: "italic" }}>Produk tidak ditemukan...</li>
                )}
              </ul>
            )}
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "6px" }}>Tipe Transaksi</label>
            <select className="input" value={transactionType} onChange={(e) => setTransactionType(e.target.value)}>
              <option value="sell">Penjualan (Sell)</option>
              <option value="buy">Restock (Buy)</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: "12px", alignItems: "end" }}>
          <div>
            <label style={{ display: "block", marginBottom: "6px" }}>Quantity</label>
            <input className="input" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Qty" />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "6px" }}>Modal</label>
            <input className="input" type="number" min="0" step="0.01" value={modal} onChange={(e) => setModal(e.target.value)} placeholder="Modal" />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "6px" }}>{transactionType === "sell" ? "Harga Jual" : "Harga Beli"}</label>
            <input className="input" type="number" min="0" step="0.01" value={hargaJual} onChange={(e) => setHargaJual(e.target.value)} placeholder={transactionType === "sell" ? "Harga Jual" : "Harga Beli"} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "6px" }}>Datetime (ops)</label>
            <input className="input" type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} />
          </div>
          
          <button 
            className="button" 
            style={{ 
                height: "42px",
                background: !selectedProductId ? "#9CA3AF" : "",
                cursor: !selectedProductId ? "not-allowed" : "pointer"
            }} 
            onClick={addItem}
            disabled={!selectedProductId}
          >
            + Tambah
          </button>
        </div>
      </div>
    </div>
  );
}