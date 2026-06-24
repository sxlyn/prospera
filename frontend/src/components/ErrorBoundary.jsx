import React from 'react';

/**
 * ErrorBoundary.jsx — React Error Boundary (Enterprise Reliability)
 *
 * Mencegah seluruh aplikasi blank white screen ketika ada runtime error
 * di komponen seperti BiAnalytics, SmartExpiryWidget, FraudDetectionWidget, dsb.
 *
 * Cara kerja:
 *   - Menangkap error di render/lifecycle child components
 *   - Menampilkan fallback UI yang informatif (bukan blank screen)
 *   - Error tetap di-log untuk debugging (componentDidCatch)
 *
 * PENTING: Error Boundary HARUS berupa class component (keterbatasan React API).
 * Tidak ada hook setara untuk getDerivedStateFromError/componentDidCatch.
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Update state agar fallback UI ditampilkan pada render berikutnya
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log error untuk debugging (di production, kirim ke Sentry/Datadog)
        console.error('[ErrorBoundary] Runtime error tertangkap:', {
            message: error.message,
            componentStack: errorInfo.componentStack
        });
    }

    handleReload = () => {
        // Reset state agar user bisa retry tanpa full page reload
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            // Fallback UI — premium, tidak blank, memberikan tindakan
            return (
                <div
                    className="d-flex flex-column align-items-center justify-content-center"
                    style={{ minHeight: '60vh', padding: '2rem', textAlign: 'center' }}
                    role="alert"
                    aria-live="assertive"
                >
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                    <h4 className="fw-bold text-body mb-2">Halaman Mengalami Gangguan</h4>
                    <p className="text-muted mb-4" style={{ maxWidth: '400px' }}>
                        Terjadi kesalahan tak terduga pada komponen ini. Data Anda tidak terpengaruh.
                        Coba muat ulang halaman atau hubungi support jika masalah berlanjut.
                    </p>
                    {/* Tombol retry tanpa full page reload */}
                    <button
                        className="btn btn-primary px-4 me-2"
                        onClick={this.handleReload}
                    >
                        <i className="fas fa-redo me-2" />
                        Coba Lagi
                    </button>
                    <button
                        className="btn btn-outline-secondary px-4"
                        onClick={() => window.location.reload()}
                    >
                        Muat Ulang Halaman
                    </button>

                    {/* Detail error — hanya tampil di development */}
                    {import.meta.env.DEV && this.state.error && (
                        <details className="mt-4 text-start" style={{ maxWidth: '600px', width: '100%' }}>
                            <summary className="text-muted small" style={{ cursor: 'pointer' }}>
                                Detail Error (Development Only)
                            </summary>
                            <pre
                                className="mt-2 p-3 rounded small"
                                style={{
                                    background: 'var(--bs-danger-bg-subtle)',
                                    color: 'var(--bs-danger)',
                                    overflowX: 'auto',
                                    fontSize: '11px'
                                }}
                            >
                                {this.state.error.toString()}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
