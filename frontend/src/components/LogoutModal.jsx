/**
 * LogoutModal.jsx — Modal konfirmasi logout
 * REFACTOR (F-T03): Diekstrak dari Sidebar.jsx untuk modularisasi.
 */
export default function LogoutModal({ show, onClose, onConfirm }) {
    if (!show) return null;

    return (
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
                            onClick={onClose}
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
                            onClick={onClose}
                            style={{ borderRadius: '8px', fontWeight: '500' }}
                        >
                            Batal
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-danger px-4 py-2" 
                            onClick={onConfirm}
                            style={{ borderRadius: '8px', fontWeight: '500' }}
                        >
                            Ya, Keluar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
