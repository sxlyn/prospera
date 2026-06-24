import React, { useState, useEffect, useRef } from 'react';

function OvertimeAuthModal({ isOpen, errorMsg, onClose, onSubmit, isSubmitting }) {
    const [pin, setPin] = useState('');
    const [localError, setLocalError] = useState(errorMsg);
    const pinInputRef = useRef(null);

    // Sync external error
    useEffect(() => {
        setLocalError(errorMsg);
    }, [errorMsg]);

    // 7-Layer Defense: Memory Leak Cleanup & Anti-Fade Quirk
    useEffect(() => {
        let focusTimer;
        if (isOpen && pinInputRef.current) {
            setPin(''); // Prevent State Leakage
            focusTimer = setTimeout(() => {
                pinInputRef.current.focus();
            }, 150);
        }
        return () => clearTimeout(focusTimer);
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Spacebar Trick Sanitization
        if (pin.trim() === '') {
            setLocalError("PIN tidak boleh kosong!");
            return;
        }

        try {
            await onSubmit(pin.trim());
        } catch (err) {
            setLocalError(err.message || "Gagal memverifikasi PIN.");
        }
    };

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} data-bs-backdrop="static" data-bs-keyboard="false">
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content shadow-lg border-0">
                    <form onSubmit={handleSubmit}>
                        <div className="modal-header bg-danger text-white border-0">
                            <h5 className="modal-title fw-bold">
                                <i className="fas fa-clock me-2"></i>Otorisasi Sesi Lembur
                            </h5>
                            <button type="button" className="btn-close btn-close-white" onClick={onClose} disabled={isSubmitting}></button>
                        </div>
                        <div className="modal-body p-4 text-center">
                            <i className="fas fa-lock text-warning mb-3" style={{ fontSize: '3rem' }}></i>
                            <h6 className="fw-bold mb-3">Akses di Luar Jam Operasional Ditolak</h6>
                            
                            {localError && (
                                <div className="alert alert-danger small py-2 text-start">
                                    <i className="fas fa-exclamation-circle me-1"></i>{localError}
                                </div>
                            )}
                            
                            <p className="text-muted small mb-3">
                                Waktu operasional telah habis. Masukkan PIN Override untuk mengaktifkan Sesi Lembur selama 1 jam ke depan.
                            </p>
                            
                            <input 
                                type="password" 
                                className="form-control form-control-lg text-center fw-bold letter-spacing-2" 
                                placeholder="••••••"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                disabled={isSubmitting}
                                ref={pinInputRef}
                                maxLength={20}
                            />
                        </div>
                        <div className="modal-footer bg-light border-0 justify-content-center">
                            <button type="button" className="btn btn-secondary px-4" onClick={onClose} disabled={isSubmitting}>Batal</button>
                            <button type="submit" className="btn btn-danger px-4" disabled={isSubmitting}>
                                {isSubmitting ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Memverifikasi...</> : 'Buka Sesi Lembur'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default OvertimeAuthModal;
