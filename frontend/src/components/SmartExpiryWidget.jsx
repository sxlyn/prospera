import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getExpiringProducts, applyMarkdown, writeOffExpiredStock, formatError } from '../utils/api';
import { formatRupiah } from '../utils/format';

function SmartExpiryWidget({ isDashboard = false }) {
    const [expiringSoon, setExpiringSoon] = useState([]);
    const [alreadyExpired, setAlreadyExpired] = useState([]);
    const [spoilageLoss, setSpoilageLoss] = useState(0);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Tab State
    const [activeTab, setActiveTab] = useState('WARNING');

    // State untuk Modal Markdown
    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [newPrice, setNewPrice] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State untuk Modal Write-Off (Pemusnahan)
    const [showWriteOffModal, setShowWriteOffModal] = useState(false);
    const [productToWriteOff, setProductToWriteOff] = useState(null);

    // State untuk notifikasi inline
    const [inlineSuccess, setInlineSuccess] = useState('');
    const [inlineError, setInlineError] = useState('');

    useEffect(() => {
        fetchExpiringProducts();
    }, []);

    const fetchExpiringProducts = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const data = await getExpiringProducts();
            setExpiringSoon(data.expiring_soon || []);
            setAlreadyExpired(data.already_expired || []);
            setSpoilageLoss(data.total_spoilage_loss || 0);
            setError(null);
        } catch (err) {
            setError(formatError(err));
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleOpenModal = (product) => {
        setSelectedProduct(product);
        // Default: harga modal
        setNewPrice(product.product_cost.toString());
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedProduct(null);
        setNewPrice('');
    };

    const handleApplyMarkdown = async () => {
        if (!selectedProduct || !newPrice) return;
        
        const numNewPrice = parseInt(newPrice);
        if (numNewPrice < 0) {
            setInlineError("Harga tidak boleh negatif!");
            return;
        }

        try {
            setIsSubmitting(true);
            setInlineError('');
            await applyMarkdown(selectedProduct.product_id, numNewPrice);
            setInlineSuccess("Berhasil mengaplikasikan diskon markdown!");
            fetchExpiringProducts(true); // Refresh list silently without unmounting
            setTimeout(() => {
                setInlineSuccess('');
                handleCloseModal();
            }, 1500); // Tunda penutupan agar user bisa melihat pesan sukses
        } catch (err) {
            setInlineError(formatError(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenWriteOffModal = (product) => {
        setProductToWriteOff(product);
        setShowWriteOffModal(true);
    };

    const handleCloseWriteOffModal = () => {
        setShowWriteOffModal(false);
        setProductToWriteOff(null);
    };

    const executeWriteOff = async () => {
        if (!productToWriteOff) return;

        try {
            setIsSubmitting(true);
            setInlineError('');
            await writeOffExpiredStock(productToWriteOff.product_id);
            setInlineSuccess("Stok basi berhasil dimusnahkan dan dicatat ke log audit.");
            fetchExpiringProducts(true); // Refresh list silently
            setTimeout(() => {
                setInlineSuccess('');
                handleCloseWriteOffModal();
            }, 1500);
        } catch (err) {
            setInlineError(formatError(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Cleanup modal backdrops if component unmounts or alerts become 0
    useEffect(() => {
        const totalAlerts = expiringSoon.length + alreadyExpired.length;
        if (!loading && totalAlerts === 0) {
            cleanupModals();
        }
    }, [expiringSoon, alreadyExpired, loading]);

    useEffect(() => {
        return () => {
            cleanupModals();
        };
    }, []);

    const cleanupModals = () => {
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(b => b.remove());
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    };

    if (loading) {
        return <div className="card shadow-sm mb-4"><div className="card-body">Memuat peringatan kedaluwarsa...</div></div>;
    }

    if (error) {
        return <div className="alert alert-danger mb-4">{error}</div>;
    }

    const totalAlerts = expiringSoon.length + alreadyExpired.length;
    
    let cardStatusColor = 'success';
    let cardTitle = 'Kondisi Stok Aman';
    let cardSubtitle = 'Tidak ada produk mendekati kedaluwarsa.';
    let cardIcon = 'fa-check-circle';
    
    if (alreadyExpired.length > 0) {
        cardStatusColor = 'danger';
        cardTitle = `${alreadyExpired.length} Produk Basi (Rugi ${formatRupiah(spoilageLoss)})`;
        cardSubtitle = 'Klik untuk memusnahkan stok dan log kerugian';
        cardIcon = 'fa-dumpster-fire';
    } else if (expiringSoon.length > 0) {
        cardStatusColor = 'warning';
        cardTitle = `${expiringSoon.length} Produk Mendekati Expired`;
        cardSubtitle = 'Klik untuk melihat detail produk';
        cardIcon = 'fa-calendar-times';
    }

    const cardContent = (
        <div 
            className={`card shadow-sm rounded-4 p-3 mb-3 d-flex flex-row justify-content-between align-items-center card-hover-effect ${totalAlerts === 0 ? 'border border-2 border-success' : 'border-0'}`} 
            style={{ cursor: 'pointer' }}
            {...(!isDashboard ? { 'data-bs-toggle': 'modal', 'data-bs-target': '#ExpiryModal' } : {})}
        >
            <div>
                <div className={`fw-bold ${totalAlerts === 0 ? 'text-success' : 'text-body'} mb-1`}>Peringatan Kedaluwarsa</div>
                <div className={`h5 fw-bold text-${cardStatusColor} m-0`}>{cardTitle}</div>
                <div className="text-muted small mt-1">{cardSubtitle}</div>
            </div>
            <div className={`bg-${cardStatusColor} bg-opacity-10 text-${cardStatusColor} rounded-circle d-flex justify-content-center align-items-center`} style={{width: '45px', height: '45px'}}>
                <i className={`fas ${cardIcon} fs-5`}></i>
            </div>
        </div>
    );

    if (isDashboard) {
        return (
            <Link to="/smart-predict" className="text-decoration-none text-body">
                {cardContent}
            </Link>
        );
    }

    return (
        <div className="mb-4">
            {cardContent}

            {/* The Modal */}
            <div className="modal fade" id="ExpiryModal" aria-labelledby="ExpiryModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                    <div className="modal-content border-0 shadow">
                        <div className="modal-header bg-warning text-body border-0">
                            <h5 className="modal-title fw-bold" id="ExpiryModalLabel">
                                <i className="fas fa-exclamation-triangle me-2"></i>Peringatan Kedaluwarsa (Smart Expiry)
                            </h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>

                        {/* Tabs Navigation */}
                        <div className="bg-body-secondary border-bottom px-4 pt-3">
                            <ul className="nav nav-tabs border-0" role="tablist">
                                <li className="nav-item" role="presentation">
                                    <button 
                                        className={`nav-link border-0 fw-semibold ${activeTab === 'WARNING' ? 'active bg-body text-warning border-top border-warning border-3' : 'text-muted'}`}
                                        onClick={() => setActiveTab('WARNING')}
                                    >
                                        Akan Kedaluwarsa <span className="badge bg-warning ms-1">{expiringSoon.length}</span>
                                    </button>
                                </li>
                                <li className="nav-item" role="presentation">
                                    <button 
                                        className={`nav-link border-0 fw-semibold ${activeTab === 'EXPIRED' ? 'active bg-body text-danger border-top border-danger border-3' : 'text-muted'}`}
                                        onClick={() => setActiveTab('EXPIRED')}
                                    >
                                        Pemusnahan Basi <span className="badge bg-danger ms-1">{alreadyExpired.length}</span>
                                    </button>
                                </li>
                            </ul>
                        </div>

                        <div className="modal-body p-4 bg-body-tertiary">
                            {activeTab === 'WARNING' && (
                                <div className="table-responsive bg-body rounded shadow-sm">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-secondary">
                                            <tr>
                                                <th>Produk</th>
                                                <th>Kedaluwarsa</th>
                                                <th>Stok</th>
                                                <th>Harga Saat Ini</th>
                                                <th>Aksi Preventif</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {expiringSoon.length === 0 ? (
                                                <tr><td colSpan={5} className="text-center text-muted py-4">Aman. Tidak ada produk mendekati kedaluwarsa.</td></tr>
                                            ) : (
                                                expiringSoon.map(p => (
                                                    <tr key={p.product_id}>
                                                        <td>
                                                            <div className="fw-semibold">{p.product_name}</div>
                                                            <div className="text-muted small">{p.Category?.category_name || '-'}</div>
                                                        </td>
                                                        <td>
                                                            <div className={`fw-bold ${p.days_left <= 7 ? 'text-danger' : 'text-warning'}`}>
                                                                {p.expired_date} ({p.days_left} hari lagi)
                                                            </div>
                                                        </td>
                                                        <td>{p.product_stock}</td>
                                                        <td>{formatRupiah(p.product_price)}</td>
                                                        <td>
                                                            {p.product_price <= p.product_cost ? (
                                                                <button 
                                                                    onClick={() => handleOpenModal(p)}
                                                                    className="btn btn-sm btn-outline-secondary fw-semibold"
                                                                    title="Diskon jual rugi / harga modal sudah aktif"
                                                                >
                                                                    <i className="fas fa-check-circle me-1 text-success"></i>Diskon Aktif
                                                                </button>
                                                            ) : (
                                                                <button 
                                                                    onClick={() => handleOpenModal(p)}
                                                                    className="btn btn-sm btn-outline-warning fw-semibold"
                                                                >
                                                                    <i className="fas fa-tags me-1"></i>Terapkan Diskon
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {activeTab === 'EXPIRED' && (
                                <React.Fragment>
                                    {alreadyExpired.length > 0 && (
                                        <div className="alert alert-danger shadow-sm border-0 mb-4 d-flex align-items-center">
                                            <i className="fas fa-exclamation-triangle fs-3 me-3"></i>
                                            <div>
                                                <h6 className="fw-bold mb-1">Peringatan Kepatuhan (Compliance Warning)</h6>
                                                <p className="mb-0 small">Menjual produk yang sudah melewati batas kedaluwarsa adalah pelanggaran standar ritel. Segera musnahkan fisik produk dan catat kerugian modal ke dalam log inventaris sebesar <strong>{formatRupiah(spoilageLoss)}</strong>.</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="table-responsive bg-body rounded shadow-sm">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="table-secondary">
                                                <tr>
                                                    <th>Produk</th>
                                                    <th>Status (Basi)</th>
                                                    <th>Sisa Stok</th>
                                                    <th>Kerugian Susut (Modal)</th>
                                                    <th>Aksi Kepatuhan</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {alreadyExpired.length === 0 ? (
                                                    <tr><td colSpan={5} className="text-center text-success py-4"><i className="fas fa-check-circle me-1"></i>Tidak ada produk basi. Kepatuhan terjaga 100%.</td></tr>
                                                ) : (
                                                    alreadyExpired.map(p => {
                                                        const loss = p.product_cost * p.product_stock;
                                                        return (
                                                            <tr key={p.product_id}>
                                                                <td>
                                                                    <div className="fw-semibold text-danger">{p.product_name}</div>
                                                                    <div className="text-muted small">{p.Category?.category_name || '-'}</div>
                                                                </td>
                                                                <td>
                                                                    <div className="fw-bold text-danger">
                                                                        {p.expired_date} ({Math.abs(p.days_left)} hari lewat)
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <span className="badge bg-danger">{p.product_stock}</span>
                                                                </td>
                                                                <td>
                                                                    <div className="fw-bold text-body">{formatRupiah(loss)}</div>
                                                                    <div className="text-muted small">{formatRupiah(p.product_cost)}/item</div>
                                                                </td>
                                                                <td>
                                                                    <button 
                                                                        onClick={() => handleOpenWriteOffModal(p)}
                                                                        className="btn btn-sm btn-danger fw-semibold"
                                                                        disabled={isSubmitting}
                                                                    >
                                                                        <i className="fas fa-dumpster-fire me-1"></i>Musnahkan Stok
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </React.Fragment>
                            )}
                        </div>
                        <div className="modal-footer border-top bg-body">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Diskon */}
            {showModal && selectedProduct && (
                <div 
                    className="modal fade show" 
                    style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}
                    onFocusCapture={(e) => e.stopPropagation()}
                    onMouseDownCapture={(e) => e.stopPropagation()}
                    onKeyDownCapture={(e) => e.stopPropagation()}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold">Set Diskon Markdown</h5>
                                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                            </div>
                            <div className="modal-body">
                                {inlineError && <div className="alert alert-danger mb-3 py-2 small">{inlineError}</div>}
                                {inlineSuccess && <div className="alert alert-success mb-3 py-2 small">{inlineSuccess}</div>}
                                
                                <p className="mb-3 text-muted small">
                                    Produk <strong>{selectedProduct.product_name}</strong> mendekati tanggal kedaluwarsa. Turunkan harga untuk mempercepat penjualan.
                                </p>
                                
                                <div className="bg-body-secondary p-3 rounded mb-3">
                                    <div className="d-flex justify-content-between mb-1">
                                        <span className="text-muted small">Harga Modal:</span>
                                        <span className="fw-semibold">{formatRupiah(selectedProduct.product_cost)}</span>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span className="text-muted small">Harga Jual Saat Ini:</span>
                                        <span className="fw-semibold">{formatRupiah(selectedProduct.product_price)}</span>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-semibold small">Harga Jual Baru (Rp)</label>
                                    <input 
                                        type="number" 
                                        value={newPrice}
                                        onChange={(e) => setNewPrice(e.target.value)}
                                        className="form-control"
                                        placeholder="Masukkan nominal harga diskon"
                                    />
                                    {newPrice && parseInt(newPrice) < selectedProduct.product_cost && (
                                        <div className="form-text text-danger mt-1">
                                            <i className="fas fa-exclamation-circle me-1"></i> Peringatan: Anda mengatur harga di bawah modal (Jual Rugi).
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Batal</button>
                                <button 
                                    type="button" 
                                    className="btn btn-primary fw-semibold" 
                                    onClick={handleApplyMarkdown}
                                    disabled={isSubmitting || !newPrice}
                                >
                                    {isSubmitting ? 'Memproses...' : 'Terapkan Harga Baru'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Pemusnahan */}
            {showWriteOffModal && productToWriteOff && (
                <div 
                    className="modal fade show" 
                    style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}
                    onFocusCapture={(e) => e.stopPropagation()}
                    onMouseDownCapture={(e) => e.stopPropagation()}
                    onKeyDownCapture={(e) => e.stopPropagation()}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header bg-danger text-white border-0">
                                <h5 className="modal-title fw-bold">Konfirmasi Pemusnahan</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={handleCloseWriteOffModal}></button>
                            </div>
                            <div className="modal-body p-4">
                                {inlineError && <div className="alert alert-danger mb-3 py-2 small">{inlineError}</div>}
                                <div className="text-center mb-4">
                                    <i className="fas fa-dumpster-fire text-danger mb-3" style={{ fontSize: '3rem' }}></i>
                                    <h5 className="fw-bold text-body">Apakah Anda yakin?</h5>
                                    <p className="text-muted mb-0">Tindakan pemusnahan stok ini bersifat final dan tidak dapat dibatalkan.</p>
                                </div>
                                <div className="bg-light rounded p-3 text-center">
                                    <div className="text-muted small mb-1">Produk yang dimusnahkan:</div>
                                    <div className="fw-bold text-body fs-5">{productToWriteOff.product_name}</div>
                                    <div className="mt-2 text-danger fw-semibold">Jumlah: {productToWriteOff.product_stock} Unit</div>
                                    <div className="mt-1 small text-body">
                                        Total Kerugian Modal: <strong>{formatRupiah(productToWriteOff.product_cost * productToWriteOff.product_stock)}</strong>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-0 pt-0 justify-content-center pb-4">
                                <button type="button" className="btn btn-light fw-semibold px-4" onClick={handleCloseWriteOffModal} disabled={isSubmitting}>Batal</button>
                                <button 
                                    type="button" 
                                    className="btn btn-danger fw-bold px-4 shadow-sm" 
                                    onClick={executeWriteOff}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Mengeksekusi...' : 'Ya, Musnahkan Stok'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SmartExpiryWidget;
