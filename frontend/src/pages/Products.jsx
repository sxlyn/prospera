/**
 * Products.jsx — Halaman Manajemen Produk (Orchestrator)
 * REFACTOR (F-S02): Logika form & list dipecah ke ProductForm.jsx dan ProductList.jsx.
 * File ini hanya menjadi "pengatur" state utama dan API calls.
 * 
 * Sebelum: 290 baris (form + list + pagination semua inline)
 * Sesudah: ~105 baris (state + API calls saja)
 */
import { useEffect, useState, useCallback } from "react";
import { apiFetch, getUserRole, formatError } from "../utils/api";
import ProductForm from "../components/ProductForm";
import ProductList from "../components/ProductList";

export default function Products() {
  const role = getUserRole();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [recentlyAdded, setRecentlyAdded] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editData, setEditData] = useState(null);
  const [message, setMessage] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  // PERFORMANCE FIX (F-S16): useCallback mencegah re-create fungsi setiap render
  const fetchProducts = useCallback(async (page = 1) => {
    try {
      const data = await apiFetch(`/products?page=${page}&limit=${limit}`);
      if (data.products) {
        setProducts(data.products);
        setTotalPages(data.totalPages);
        setTotalItems(data.totalItems);
        setCurrentPage(data.currentPage);
      } else {
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      setMessage(formatError(error));
    }
  }, [limit]);

  useEffect(() => {
    fetchProducts();
    window.addEventListener("focus", fetchProducts);
    return () => window.removeEventListener("focus", fetchProducts);
  }, [fetchProducts]);

  const handleSave = async (payload) => {
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
    setRecentlyAdded({ name: payload.product_name });
    setSelectedProduct(null);
    setEditData(null);
    fetchProducts(currentPage);
  };

  const handleEdit = (product) => {
    setSelectedProduct(product.product_id || product.id);
    setEditData({
      name: product.product_name || product.name || "",
      cost: product.product_cost ?? "",
      price: product.product_price ?? "",
      stock: product.product_stock ?? "",
      category_id: product.category_id_fk || "",
      expired_date: product.expired_date || ""
    });
    setMessage("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Yakin ingin menghapus produk ini?")) return;
    try {
      await apiFetch(`/products/${productId}`, { method: "DELETE" });
      setMessage("Produk berhasil dihapus.");
      fetchProducts(currentPage);
    } catch (err) {
      setMessage(formatError(err));
    }
  };

  const handleCancel = () => {
    setSelectedProduct(null);
    setEditData(null);
    setMessage("");
  };

  return (
    <>
      <div className="card">
        <h2>📦 Product Management</h2>

        {message && (
          <div className={`product-alert ${message.includes("berhasil") ? "product-alert--success" : "product-alert--error"}`}>
            {message}
          </div>
        )}

        {(role === 'owner' || role === 'karyawan') && (
          <ProductForm 
            selectedProduct={selectedProduct}
            initialData={editData}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}

        {recentlyAdded && (
          <div className="card product-recently-added">
            <h3 className="text-green">✨ Recently Added</h3>
            <div className="product-item">
              <div>
                <b>{recentlyAdded.name}</b>
                <div className="stock">Baru saja berhasil didaftarkan ke database!</div>
              </div>
            </div>
          </div>
        )}

        <ProductList 
          products={products}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          role={role}
          onEdit={handleEdit}
          onDelete={handleDelete}
          pagination={{ currentPage, totalPages, totalItems }}
          onPageChange={fetchProducts}
        />
      </div>
    </>
  );
}