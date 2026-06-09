import { useEffect, useState } from "react";
import { apiFetch, getUserRole, formatError } from "../utils/api";
import { formatRupiah } from "../utils/format";

export default function Products() {
  const role = getUserRole();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [recentlyAdded, setRecentlyAdded] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [message, setMessage] = useState("");
  
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  // BEST PRACTICE: State Loading untuk mencegah Double Submit
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10; // 10 items per page

  const fetchProducts = async (page = 1) => {
    try {
      const data = await apiFetch(`/products?page=${page}&limit=${limit}`);
      if (data.products) {
        setProducts(data.products);
        setTotalPages(data.totalPages);
        setTotalItems(data.totalItems);
        setCurrentPage(data.currentPage);
      } else {
        // Fallback for old API format
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      setMessage(formatError(error));
    }
  };

  useEffect(() => {
    fetchProducts();
    window.addEventListener("focus", fetchProducts);
    return () => window.removeEventListener("focus", fetchProducts);
  }, []);

  const saveProduct = async (e) => {
    e.preventDefault();

    // BEST PRACTICE: Pengecekan Eksplisit (angka 0 dianggap sah)
    if (name.trim() === "" || cost === "" || price === "" || stock === "") {
      setMessage("Semua field harus diisi (angka 0 diperbolehkan).");
      return;
    }

    if (Number(cost) < 0 || Number(price) < 0 || Number(stock) < 0) {
      setMessage("Harga dan stok tidak boleh negatif.");
      return;
    }

    if (!Number.isInteger(Number(stock))) {
      setMessage("Stok harus berupa bilangan bulat.");
      return;
    }

    setIsSubmitting(true); // Kunci tombol saat mulai nge-hit API
    setMessage("");

    const payload = {
      product_name: name,
      product_cost: Number(cost),
      product_price: Number(price),
      product_stock: Number(stock)
    };

    try {
      if (selectedProduct) {
        await apiFetch(`/products/${selectedProduct}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        setMessage("Produk berhasil diperbarui.");
      } else {
        await apiFetch("/products", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        setMessage("Produk berhasil ditambahkan.");
      }

      setRecentlyAdded({ name, cost, price, stock });
      setName("");
      setCost("");
      setPrice("");
      setStock("");
      setSelectedProduct(null);
      fetchProducts();
    } catch (err) {
      setMessage(formatError(err));
    } finally {
      setIsSubmitting(false); // Buka kunci tombol kembali setelah selesai
    }
  };

  const editProduct = (product) => {
    setSelectedProduct(product.product_id || product.id);
    setName(product.product_name || product.name || "");
    setCost(product.product_cost ?? "");
    setPrice(product.product_price ?? "");
    setStock(product.product_stock ?? "");
    setMessage("");
    window.scrollTo({ top: 0, behavior: 'smooth' }); // UX: Gulir ke atas
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm("Yakin ingin menghapus produk ini? Riwayat penjualan yang terkait mungkin terdampak.")) return;

    try {
      await apiFetch(`/products/${productId}`, { method: "DELETE" });
      setMessage("Produk berhasil dihapus.");
      fetchProducts();
    } catch (err) {
      setMessage(formatError(err));
    }
  };

  const filteredProducts = products.filter(p => {
    const nameMatch = (p.product_name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const idMatch = String(p.product_id || p.id).includes(searchTerm);
    return nameMatch || idMatch;
  });

  return (
    <>
      <div className="card">
        <h2>📦 Product Management</h2>

        {/* --- KOTAK PESAN (ALERT) --- */}
        {message && (
          <div style={{ 
            padding: "12px 16px", 
            borderRadius: "8px", 
            backgroundColor: message.includes("berhasil") ? "#dcfce7" : "#fee2e2", 
            color: message.includes("berhasil") ? "#16a34a" : "#dc2626",
            border: `1px solid ${message.includes("berhasil") ? "#4ade80" : "#f87171"}`,
            marginBottom: "20px",
            fontWeight: "500"
          }}>
            {message}
          </div>
        )}
        {/* --------------------------- */}

        {/* Form produk tersedia untuk Owner dan Karyawan */}
        {(role === 'owner' || role === 'karyawan') && (
        <div className="card">
          <h3>{selectedProduct ? "Edit Product" : "Add Product"}</h3>
          <div className="form-row" style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            <input className="input" placeholder="Product name" style={{ flex: "1 1 45%" }} value={name} onChange={(e) => setName(e.target.value)} />
            <input className="input" placeholder="Cost (Modal)" type="number" min="0" style={{ flex: "1 1 45%" }} value={cost} onChange={(e) => setCost(e.target.value)} />
            <input className="input" placeholder="Price (Harga Jual)" type="number" min="0" style={{ flex: "1 1 45%" }} value={price} onChange={(e) => setPrice(e.target.value)} />
            <input className="input" placeholder="Stock" type="number" min="0" style={{ flex: "1 1 45%" }} value={stock} onChange={(e) => setStock(e.target.value)} />
            
            {/* BEST PRACTICE: Visual Feedback & Button Lock */}
            <button 
              type="button" 
              className="button" 
              onClick={saveProduct} 
              disabled={isSubmitting}
              style={{ flex: "1 1 100%", marginTop: "5px", opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? "not-allowed" : "pointer" }}
            >
              {isSubmitting ? "Menyimpan..." : (selectedProduct ? "Update Product" : "Add Product")}
            </button>

            {selectedProduct && !isSubmitting && (
              <button type="button" className="button" style={{ flex: "1 1 100%", marginTop: "5px", background: "#6B7280" }} onClick={() => {
                setSelectedProduct(null);
                setName("");
                setCost("");
                setPrice("");
                setStock("");
                setMessage("");
              }}>
                Cancel
              </button>
            )}
          </div>
        </div>
        )}

        {recentlyAdded && (
          <div className="card" style={{ border: "2px solid #4caf50", backgroundColor: "#f1f8e9" }}>
            <h3 style={{ color: "#2e7d32", marginTop: 0 }}>✨ Recently Added</h3>
            <div className="product-item">
              <div>
                <b>{recentlyAdded.name}</b>
                <div className="stock">Baru saja berhasil didaftarkan ke database!</div>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h3>Daftar Produk</h3>
            <input 
              className="input" 
              placeholder="🔍 Cari nama atau ID produk..." 
              style={{ width: "300px" }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filteredProducts.length > 0 ? (
            filteredProducts.map(p => (
              <div key={p.product_id || p.id} className="product-item" style={{ alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                        <small style={{ color: "gray" }}>ID: {p.product_id || p.id}</small>
                        
                        {/* --- SINGLE SOURCE OF TRUTH APPLIED HERE --- */}
                        <span className={p.stock_status === "Low Stock" ? "badge low" : "badge safe"} style={{ padding: "2px 8px", fontSize: "10px" }}>
                          {p.stock_status || "Safe"}
                        </span>
                        {/* ------------------------------------------- */}
                        
                      </div>
                      <b>{p.product_name || p.name}</b>
                    </div>
                    {(role === 'owner' || role === 'karyawan') && (
                    <div>
                      <button className="button" style={{ marginRight: "8px" }} onClick={() => editProduct(p)}>
                        Edit
                      </button>
                      <button className="button-delete" onClick={() => deleteProduct(p.product_id || p.id)}>
                        Delete
                      </button>
                    </div>
                    )}
                  </div>
                  <div className="stock" style={{ marginTop: "8px" }}>
                    {/* BEST PRACTICE: Format Rupiah */}
                    Modal: {formatRupiah(p.product_cost)} | Jual: <span style={{color: "#059669", fontWeight: "bold"}}>{formatRupiah(p.product_price)}</span> | Stok: {p.product_stock}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p style={{ textAlign: "center", color: "gray" }}>
              {searchTerm ? "Produk tidak ditemukan." : "Belum ada produk di database."}
            </p>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && !searchTerm && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", borderTop: "1px solid #e5e7eb", paddingTop: "15px" }}>
              <span style={{ fontSize: "14px", color: "gray" }}>
                Menampilkan halaman {currentPage} dari {totalPages} ({totalItems} produk)
              </span>
              <div style={{ display: "flex", gap: "10px" }}>
                <button 
                  className="btn btn-outline-primary btn-sm" 
                  disabled={currentPage === 1}
                  onClick={() => fetchProducts(currentPage - 1)}
                  style={{ borderRadius: "6px", padding: "5px 12px" }}
                >
                  <i className="fas fa-chevron-left me-1"></i> Prev
                </button>
                <button 
                  className="btn btn-outline-primary btn-sm" 
                  disabled={currentPage === totalPages}
                  onClick={() => fetchProducts(currentPage + 1)}
                  style={{ borderRadius: "6px", padding: "5px 12px" }}
                >
                  Next <i className="fas fa-chevron-right ms-1"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}