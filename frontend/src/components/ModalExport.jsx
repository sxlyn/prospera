import { useState } from 'react';
import { apiFetchBlob, formatError } from '../utils/api';

function ModalExport() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleExport = async (format) => {
        try {
            setLoading(true);
            setError("");

            // Menggunakan apiFetchBlob terpusat (bukan hardcoded URL)
            const blob = await apiFetchBlob(`/analytics/summary/export/${format}`);
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Laporan_Prospera_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            setError(formatError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal fade" id="ModalExport" tabIndex="-1" aria-labelledby="ModalExportLabel" aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold" id="ModalExportLabel">Pilih Format Export</h5>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Tutup" />
                    </div>
                    <div className="modal-body">
                        {error && (
                            <div className="alert alert-danger py-2 mb-3" role="alert">
                                <i className="fas fa-exclamation-circle me-2"></i>{error}
                            </div>
                        )}
                        <div className="d-grid gap-3">
                            <button 
                                type="button" 
                                className="btn btn-outline-success py-3" 
                                onClick={() => handleExport('excel')}
                                disabled={loading}
                            >
                                <i className="fas fa-file-excel me-2" />{loading ? 'Memproses...' : 'XLSX (Excel)'}
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-outline-primary py-3" 
                                onClick={() => handleExport('csv')}
                                disabled={loading}
                            >
                                <i className="fas fa-file-csv me-2" />{loading ? 'Memproses...' : 'CSV'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ModalExport;
