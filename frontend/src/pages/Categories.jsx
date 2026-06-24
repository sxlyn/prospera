import { useEffect, useState, useCallback } from "react";
import { apiFetch, formatError } from "../utils/api";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState("");
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [requiresExpiredDate, setRequiresExpiredDate] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await apiFetch("/categories");
      setCategories(data.categories || []);
    } catch (error) {
      setMessage(formatError(error));
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleEdit = (category) => {
    setSelectedCategory(category.category_id);
    setCategoryName(category.category_name);
    setRequiresExpiredDate(category.requires_expired_date);
    setShowForm(true);
    setMessage("");
  };

  const handleCreateNew = () => {
    setSelectedCategory(null);
    setCategoryName("");
    setRequiresExpiredDate(false);
    setShowForm(true);
    setMessage("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const payload = {
        category_name: categoryName,
        requires_expired_date: requiresExpiredDate
      };

      if (selectedCategory) {
        await apiFetch(`/categories/${selectedCategory}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        setMessage("Kategori berhasil diperbarui.");
      } else {
        await apiFetch("/categories", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        setMessage("Kategori berhasil ditambahkan.");
      }
      
      setShowForm(false);
      fetchCategories();
    } catch (error) {
      setMessage(formatError(error));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus kategori ini?")) return;
    try {
      await apiFetch(`/categories/${id}`, { method: "DELETE" });
      setMessage("Kategori berhasil dihapus.");
      fetchCategories();
    } catch (error) {
      setMessage(formatError(error));
    }
  };

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0 fw-bold text-body">Manajemen Kategori</h2>
        {!showForm && (
          <button className="button button-primary" onClick={handleCreateNew}>
            <i className="fas fa-plus me-2"></i> Tambah Kategori
          </button>
        )}
      </div>

      {message && (
        <div className={`alert ${message.includes('berhasil') ? 'alert-success' : 'alert-danger'} alert-dismissible fade show`} role="alert">
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage("")}></button>
        </div>
      )}

      {showForm ? (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <h5 className="card-title fw-bold mb-4">{selectedCategory ? "Edit Kategori" : "Tambah Kategori Baru"}</h5>
            <form onSubmit={handleSave}>
              <div className="mb-3">
                <label className="form-label text-secondary fw-semibold">Nama Kategori</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={categoryName} 
                  onChange={(e) => setCategoryName(e.target.value)} 
                  required 
                  placeholder="Contoh: Makanan, Obat-obatan"
                />
              </div>
              <div className="mb-4 form-check form-switch">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  role="switch" 
                  id="requiresExpired"
                  checked={requiresExpiredDate}
                  onChange={(e) => setRequiresExpiredDate(e.target.checked)}
                />
                <label className="form-check-label text-secondary" htmlFor="requiresExpired">
                  Kategori ini membutuhkan Input Tanggal Kedaluwarsa (Expired Date)
                </label>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="button button-primary">
                  <i className="fas fa-save me-2"></i> Simpan
                </button>
                <button type="button" className="button button-outline" onClick={() => setShowForm(false)}>
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table-simple w-100">
                <thead>
                  <tr>
                    <th>Nama Kategori</th>
                    <th>Wajib Expired Date?</th>
                    <th className="text-end">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center py-4 text-muted">Belum ada data kategori</td>
                    </tr>
                  ) : (
                    categories.map(cat => (
                      <tr key={cat.category_id}>
                        <td className="fw-medium">{cat.category_name}</td>
                        <td>
                          {cat.requires_expired_date ? (
                            <span className="badge safe"><i className="fas fa-check me-1"></i> Ya</span>
                          ) : (
                            <span className="badge low"><i className="fas fa-times me-1"></i> Tidak</span>
                          )}
                        </td>
                        <td className="text-end">
                          <button 
                            className="btn btn-sm btn-outline-primary me-2" 
                            style={{ borderRadius: "8px" }}
                            onClick={() => handleEdit(cat)}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger" 
                            style={{ borderRadius: "8px" }}
                            onClick={() => handleDelete(cat.category_id)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
