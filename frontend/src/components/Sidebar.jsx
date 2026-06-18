/**
 * Sidebar.jsx — Navigasi Samping Aplikasi
 * REFACTOR (F-T03): Modal Logout & Change Password dipecah ke komponen terpisah.
 * Sidebar kini hanya fokus pada navigasi dan rendering menu.
 * 
 * Sebelum: 272 baris (termasuk 2 modal inline + state + handler)
 * Sesudah: ~80 baris (navigasi murni)
 */
import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { clearAuthSession } from '../utils/api';
import LogoutModal from './LogoutModal';
import ChangePasswordModal from './ChangePasswordModal';

function Sidebar() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [role, setRole] = useState(null);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

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
        { path: '/categories', label: 'Kategori', icon: 'fas fa-tags', roles: ['owner', 'karyawan'] },
        { path: '/transaction', label: 'Transaksi', icon: 'fas fa-shopping-cart', roles: ['owner', 'karyawan'] },
        { path: '/bi-analytics', label: 'Analitik Bisnis', icon: 'fas fa-chart-bar', roles: ['owner'] },
        { path: '/smart-predict', label: 'Fitur Pintar', icon: 'fas fa-robot', roles: ['owner'] },
        { path: '/user-management', label: 'Kelola User', icon: 'fas fa-users-cog', roles: ['owner'] },
    ];

    const menu = allMenu.filter(item => !role || item.roles.includes(role));

    const confirmLogout = () => {
        clearAuthSession();
        navigate('/login');
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
                        onClick={() => setShowPasswordModal(true)}
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

            {/* Modal diekstrak ke komponen terpisah (F-T03) */}
            <LogoutModal 
                show={showLogoutModal} 
                onClose={() => setShowLogoutModal(false)} 
                onConfirm={confirmLogout} 
            />
            <ChangePasswordModal 
                show={showPasswordModal} 
                onClose={() => setShowPasswordModal(false)} 
            />
        </>
    );
}

export default Sidebar;
