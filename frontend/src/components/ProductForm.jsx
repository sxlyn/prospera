/**
 * ProductForm.jsx — Form tambah/edit produk
 * REFACTOR (F-S02): Diekstrak dari Products.jsx untuk modularisasi.
 */
import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

export default function ProductForm({ selectedProduct, initialData, onSave, onCancel }) {
    const [name, setName] = useState("");
    const [cost, setCost] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [expiredDate, setExpiredDate] = useState("");
    const [categories, setCategories] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formMessage, setFormMessage] = useState("");

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await apiFetch("/categories");
                setCategories(data.categories || []);
            } catch (err) {
                console.error("Gagal memuat kategori:", err);
            }
        };
        fetchCategories();
    }, []);

    // Sinkronisasi form saat mode edit aktif
    useEffect(() => {
        if (initialData) {
            setName(initialData.name || "");
            setCost(initialData.cost ?? "");
            setPrice(initialData.price ?? "");
            setStock(initialData.stock ?? "");
            setCategoryId(initialData.category_id || "");
            setExpiredDate(initialData.expired_date || "");
            setFormMessage("");
        }
    }, [initialData, selectedProduct]);

    const resetForm = () => {
        setName(""); setCost(""); setPrice(""); setStock("");
        setCategoryId(""); setExpiredDate("");
        setFormMessage("");
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setFormMessage("");

        if (name.trim() === "" || cost === "" || price === "" || stock === "") {
            setFormMessage("Semua field harus diisi (angka 0 diperbolehkan).");
            return;
        }
        if (Number(cost) < 0 || Number(price) < 0 || Number(stock) < 0) {
            setFormMessage("Harga dan stok tidak boleh negatif.");
            return;
        }
        if (!Number.isInteger(Number(stock))) {
            setFormMessage("Stok harus berupa bilangan bulat.");
            return;
        }

        setIsSubmitting(true);
        try {
            await onSave({
                product_name: name,
                product_cost: Number(cost),
                product_price: Number(price),
                product_stock: Number(stock),
                category_id_fk: categoryId || null,
                expired_date: expiredDate || null
            });
            resetForm();
        } catch (err) {
            setFormMessage(err.message || "Gagal menyimpan produk.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="card">
            <h3>{selectedProduct ? "Edit Product" : "Add Product"}</h3>

            {formMessage && (
                <div className="product-alert product-alert--error">
                    {formMessage}
                </div>
            )}

            <div className="product-form-row mb-3 d-flex gap-3">
                <input className="input product-form-field" placeholder="Product name" value={name} onChange={(e) => setName(e.target.value)} />
                <select 
                    className="input product-form-field" 
                    value={categoryId} 
                    onChange={(e) => {
                        setCategoryId(e.target.value);
                        setExpiredDate("");
                    }}
                >
                    <option value="">-- Pilih Kategori --</option>
                    {categories.map(c => (
                        <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                    ))}
                </select>

                {categoryId && categories.find(c => String(c.category_id) === String(categoryId))?.requires_expired_date && (
                    <input 
                        type="date" 
                        className="input product-form-field" 
                        value={expiredDate} 
                        onChange={(e) => setExpiredDate(e.target.value)} 
                        title="Tanggal Kedaluwarsa"
                    />
                )}
            </div>

            <div className="product-form-row d-flex gap-3">
                <input className="input product-form-field" placeholder="Cost (Modal)" type="number" min="0" value={cost} onChange={(e) => setCost(e.target.value)} />
                <input className="input product-form-field" placeholder="Price (Harga Jual)" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
                <input className="input product-form-field" placeholder="Stock" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} />

                <button 
                    type="button" 
                    className="button product-form-btn"
                    onClick={handleSave} 
                    disabled={isSubmitting}
                    style={{ opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? "not-allowed" : "pointer" }}
                >
                    {isSubmitting ? "Menyimpan..." : (selectedProduct ? "Update Product" : "Add Product")}
                </button>

                {selectedProduct && !isSubmitting && (
                    <button 
                        type="button" 
                        className="button product-form-btn" 
                        style={{ background: "#6B7280" }} 
                        onClick={() => { resetForm(); onCancel(); }}
                    >
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
}
