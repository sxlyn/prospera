import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { clearAuthSession, getUserRole, formatError } from '../utils/api';

function Sidebar() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [role, setRole] = useState(null);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // Change Password State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [passwordMessage, setPasswordMessage] = useState("");
    const [passwordMessageType, setPasswordMessageType] = useState("");
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            try {
                const user = JSON.parse(userData);
                setUsername(user.username || user.name || "");
                setRole(user.role || null);
            } catch {
                // Data corrupt — abaikan
            }
        }
    }, []);

    // Menu dinamis berdasarkan role
    const allMenu = [
        { path: '/dashboard', label: 'Dashboard', icon: 'fas fa-th-large', roles: ['owner'] },
        { path: '/products', label: 'Produk', icon: 'fas fa-box', roles: ['owner', 'karyawan'] },
        { path: '/transaction', label: 'Transaksi', icon: 'fas fa-shopping-cart', roles: ['owner', 'karyawan'] },
        { path: '/bi-analytics', label: 'Analitik Bisnis', icon: 'fas fa-chart-bar', roles: ['owner'] },
        { path: '/smart-predict', label: 'Fitur Pintar', icon: 'fas fa-robot', roles: ['owner'] },
        { path: '/user-management', label: 'Kelola User', icon: 'fas fa-users-cog', roles: ['owner'] },
    ];

    // Filter menu berdasarkan role user
    const menu = allMenu.filter(item => !role || item.roles.includes(role));

    const confirmLogout = () => {
        clearAuthSession();
        navigate('/login');
    };

    const handleChangePassword = async () => {
        setPasswordMessage("");
        
        if (!oldPassword.trim()) {
            setPasswordMessage("Password lama wajib diisi.");
            setPasswordMessageType("error");
            return;
        }
        if (!newPassword || newPassword.length < 6) {
            setPasswordMessage("Password baru minimal 6 karakter.");
            setPasswordMessageType("error");
            return;
        }
        if (oldPassword === newPassword) {
            setPasswordMessage("Password baru tidak boleh sama dengan yang lama.");
            setPasswordMessageType("error");
            return;
        }

        setIsSubmittingPassword(true);
        try {
            const { apiFetch } = await import('../utils/api');
            const data = await apiFetch("/auth/change-password", {
                method: "PUT",
                body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
            });
            setPasswordMessage(data.message || "Password berhasil diubah!");
            setPasswordMessageType("success");
            setOldPassword("");
            setNewPassword("");
            
            // Auto close modal after 2 seconds on success
            setTimeout(() => {
                setShowPasswordModal(false);
                setPasswordMessage("");
            }, 2000);
        } catch (err) {
            setPasswordMessage(formatError(err));
            setPasswordMessageType("error");
        } finally {
            setIsSubmittingPassword(false);
        }
    };

    return (
        <>
            <aside className="sidebar d-flex flex-column justify-content-between pb-4">
                <div>
                    <div className="logo px-2">
                        <i className="fas fa-layer-group"/><span>Prospera</span>
                    </div>

                    {username && (
                        <div className="px-3 mb-4 text-center">
                            <small className="d-block text-white-50">Selamat datang,</small>
                            <div className="fw-bold text-white h6 mb-0">Hi, {username}!</div>
                            {role && (
                                <span className="badge mt-1" style={{ 
                                    background: role === 'owner' ? 'rgba(234,179,8,0.2)' : 'rgba(96,165,250,0.2)', 
                                    color: role === 'owner' ? '#FCD34D' : '#93C5FD',
                                    fontSize: '10px',
                                    padding: '3px 10px',
                                    borderRadius: '12px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    {role === 'owner' ? '👑 Owner' : '🧾 Karyawan'}
                                </span>
                            )}
                        </div>
                    )}

                    <ul className="nav flex-column">
                        {menu.map((item) => (
                            <li className="nav-item" key={item.path}>
                                <NavLink 
                                    to={item.path} 
                                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                >
                                    <i className={item.icon} />
                                    <span className="nav-text">{item.label}</span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </div>
                
                <div className="px-3">
                    <button 
                        onClick={() => {
                            setShowPasswordModal(true);
                            setPasswordMessage("");
                            setOldPassword("");
                            setNewPassword("");
                        }}
                        className="nav-link w-100 border-0 bg-transparent text-start mb-2"
                        style={{ cursor: 'pointer' }}
                    >
                        <i className="fas fa-key" />
                        <span className="nav-text">Ganti Password</span>
                    </button>
                    <button 
                        onClick={() => setShowLogoutModal(true)}
                        className="nav-link w-100 border-0 bg-transparent text-start"
                        style={{ cursor: 'pointer' }}
                    >
                        <i className="fas fa-sign-out-alt" />
                        <span className="nav-text">Keluar</span>
                    </button>
                </div>
            </aside>

            {/* --- MODAL KONFIRMASI LOGOUT --- */}
            {showLogoutModal && (
                <div 
                    className="modal d-block" 
                    tabIndex="-1" 
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0" style={{ borderRadius: '12px' }}>
                            <div className="modal-header border-0 pb-0">
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setShowLogoutModal(false)}
                                    aria-label="Close"
                                ></button>
                            </div>
                            <div className="modal-body text-center py-4">
                                <i className="fas fa-sign-out-alt fa-3x text-danger mb-3"></i>
                                <p className="mb-0 text-secondary" style={{ fontSize: '1.1rem' }}>
                                    Apakah Anda yakin ingin keluar dari Prospera?
                                </p>
                            </div>
                            <div className="modal-footer border-0 justify-content-center pt-0 pb-4">
                                <button 
                                    type="button" 
                                    className="btn btn-light px-4 py-2 me-2" 
                                    onClick={() => setShowLogoutModal(false)}
                                    style={{ borderRadius: '8px', fontWeight: '500' }}
                                >
                                    Batal
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-danger px-4 py-2" 
                                    onClick={confirmLogout}
                                    style={{ borderRadius: '8px', fontWeight: '500' }}
                                >
                                    Ya, Keluar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL GANTI PASSWORD --- */}
            {showPasswordModal && (
                <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0" style={{ borderRadius: '12px' }}>
                            <div className="modal-header border-bottom-0 pb-0">
                                <h5 className="modal-title fw-bold"><i className="fas fa-key me-2 text-primary"></i>Ganti Password</h5>
                                <button type="button" className="btn-close" onClick={() => setShowPasswordModal(false)}></button>
                            </div>
                            <div className="modal-body py-4">
                                {passwordMessage && (
                                    <div className={`alert ${passwordMessageType === 'success' ? 'alert-success' : 'alert-danger'} py-2`} style={{ borderRadius: '8px', fontSize: '14px' }}>
                                        {passwordMessage}
                                    </div>
                                )}
                                <div className="mb-3">
                                    <label className="form-label small fw-semibold text-muted">Password Lama</label>
                                    <input 
                                        type="password" 
                                        className="form-control" 
                                        placeholder="Masukkan password saat ini"
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-semibold text-muted">Password Baru</label>
                                    <input 
                                        type="password" 
                                        className="form-control" 
                                        placeholder="Minimal 6 karakter"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer border-top-0 pt-0 pb-4">
                                <button 
                                    type="button" 
                                    className="btn btn-light px-4 py-2" 
                                    onClick={() => setShowPasswordModal(false)}
                                    style={{ borderRadius: '8px', fontWeight: '500' }}
                                >
                                    Batal
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-primary px-4 py-2" 
                                    onClick={handleChangePassword}
                                    disabled={isSubmittingPassword}
                                    style={{ borderRadius: '8px', fontWeight: '500' }}
                                >
                                    {isSubmittingPassword ? "Menyimpan..." : "Simpan Password"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Sidebar;
