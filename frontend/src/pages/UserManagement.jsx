import { useState, useEffect } from "react";
import { apiFetch, formatError } from "../utils/api";

// Regex standar industri — selaras dengan backend
import { EMAIL_REGEX } from "../utils/validators";

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("success");

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await apiFetch("/auth/users");
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            setMessage(formatError(err));
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleCreateUser = async () => {
        setMessage("");

        // Validasi client-side
        if (!username.trim()) {
            setMessage("Username wajib diisi.");
            setMessageType("error");
            return;
        }
        if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
            setMessage("Masukkan email dengan format yang valid.");
            setMessageType("error");
            return;
        }
        if (!password || password.length < 6) {
            setMessage("Password minimal 6 karakter.");
            setMessageType("error");
            return;
        }

        setIsSubmitting(true);
        try {
            const data = await apiFetch("/auth/users", {
                method: "POST",
                body: JSON.stringify({
                    username: username.trim(),
                    email: email.trim().toLowerCase(),
                    password,
                    role: "karyawan"
                })
            });
            setMessage(data.message || "Akun Karyawan berhasil dibuat.");
            setMessageType("success");
            setUsername("");
            setEmail("");
            setPassword("");
            setShowForm(false);
            fetchUsers();
        } catch (err) {
            setMessage(formatError(err));
            setMessageType("error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        try {
            const data = await apiFetch(`/auth/users/${userId}`, { method: "DELETE" });
            setMessage(data.message || "Akun berhasil dihapus.");
            setMessageType("success");
            setDeleteTarget(null);
            fetchUsers();
        } catch (err) {
            setMessage(formatError(err));
            setMessageType("error");
            setDeleteTarget(null);
        }
    };

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold m-0">
                    <i className="fas fa-users-cog me-2"></i>Kelola Pengguna
                </h3>
                <button 
                    className="btn btn-primary px-4 py-2 fw-semibold"
                    style={{ borderRadius: '10px' }}
                    onClick={() => { setShowForm(!showForm); setMessage(""); }}
                >
                    <i className={`fas ${showForm ? 'fa-times' : 'fa-user-plus'} me-2`}></i>
                    {showForm ? 'Batal' : 'Tambah Karyawan'}
                </button>
            </div>

            {/* Alert Message */}
            {message && (
                <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-danger'} py-2 shadow-sm`} 
                     role="alert" style={{ borderRadius: '10px' }}>
                    <i className={`fas ${messageType === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} me-2`}></i>
                    {message}
                </div>
            )}

            {/* Form Tambah Karyawan */}
            {showForm && (
                <div className="clean-card shadow-sm mb-4" style={{ border: '2px solid #3B82F6' }}>
                    <h6 className="fw-bold mb-3">
                        <span className="badge bg-primary me-2">Baru</span>Buat Akun Karyawan
                    </h6>
                    <div className="row g-3">
                        <div className="col-md-4">
                            <label className="form-label small fw-semibold text-muted">Username</label>
                            <input className="form-control" placeholder="Nama karyawan" value={username}
                                onChange={(e) => setUsername(e.target.value)} />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label small fw-semibold text-muted">Email</label>
                            <input className="form-control" placeholder="email@contoh.com" type="email" value={email}
                                onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label small fw-semibold text-muted">Password</label>
                            <input className="form-control" placeholder="Min. 6 karakter" type="password" value={password}
                                onChange={(e) => setPassword(e.target.value)} />
                        </div>
                    </div>
                    <div className="mt-3 text-end">
                        <button 
                            className="btn btn-primary px-4 py-2 fw-semibold" 
                            onClick={handleCreateUser}
                            disabled={isSubmitting}
                            style={{ borderRadius: '8px', opacity: isSubmitting ? 0.7 : 1 }}
                        >
                            {isSubmitting ? (
                                <><span className="spinner-border spinner-border-sm me-2"></span>Memproses...</>
                            ) : (
                                <><i className="fas fa-save me-2"></i>Simpan Akun</>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Tabel Daftar User */}
            <div className="clean-card shadow-sm">
                <h6 className="fw-bold mb-3">
                    <span className="badge bg-secondary me-2">{users.length}</span>Daftar Pengguna Terdaftar
                </h6>

                {loading ? (
                    <div className="text-center py-4">
                        <div className="spinner-border text-primary"></div>
                        <p className="mt-2 text-muted">Memuat data...</p>
                    </div>
                ) : users.length === 0 ? (
                    <p className="text-muted text-center py-4">Belum ada user terdaftar.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-simple align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.user_id}>
                                        <td className="text-muted">#{user.user_id}</td>
                                        <td className="fw-bold">{user.username}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            <span className={`badge ${user.role === 'owner' ? 'bg-warning text-body' : 'bg-info text-white'}`}
                                                  style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '8px' }}>
                                                {user.role === 'owner' ? '👑 Owner' : '🧾 Karyawan'}
                                            </span>
                                        </td>
                                        <td>
                                            {user.role === 'karyawan' ? (
                                                <button 
                                                    className="btn btn-outline-danger btn-sm px-3"
                                                    style={{ borderRadius: '8px' }}
                                                    onClick={() => setDeleteTarget(user)}
                                                >
                                                    <i className="fas fa-trash-alt me-1"></i>Hapus
                                                </button>
                                            ) : (
                                                <span className="text-muted small">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Konfirmasi Hapus */}
            {deleteTarget && (
                <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0" style={{ borderRadius: '12px' }}>
                            <div className="modal-body text-center py-4">
                                <i className="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                                <h5 className="fw-bold">Hapus Akun Karyawan?</h5>
                                <p className="text-muted mb-0">
                                    Anda akan menghapus akun <strong>"{deleteTarget.username}"</strong> ({deleteTarget.email}).
                                    <br />Aksi ini tidak dapat dibatalkan.
                                </p>
                            </div>
                            <div className="modal-footer border-0 justify-content-center pt-0 pb-4">
                                <button className="btn btn-light px-4 py-2 me-2" 
                                    onClick={() => setDeleteTarget(null)}
                                    style={{ borderRadius: '8px', fontWeight: '500' }}>
                                    Batal
                                </button>
                                <button className="btn btn-danger px-4 py-2" 
                                    onClick={() => handleDeleteUser(deleteTarget.user_id)}
                                    style={{ borderRadius: '8px', fontWeight: '500' }}>
                                    Ya, Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
