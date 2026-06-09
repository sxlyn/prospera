import React, { useEffect } from 'react';

function ErrorMessage({ error }) {
    useEffect(() => {
        if (error) {
            console.error("=== Error Details from Backend ===");
            console.error(error);
        }
    }, [error]);

    return (
        <div className="alert alert-danger m-4 d-flex align-items-center shadow-sm border-0 rounded">
            <i className="fas fa-exclamation-triangle fs-3 me-3 text-danger"></i>
            <div>
                <h6 className="fw-bold mb-1">Gagal memuat data!</h6>
                <p className="mb-0 small">
                    {error?.message || (typeof error === 'string' ? error : "Koneksi terputus atau sesi Anda mungkin telah berakhir. Silakan muat ulang (refresh) halaman atau coba login kembali.")}
                </p>
            </div>
        </div>
    );
}

export default ErrorMessage;