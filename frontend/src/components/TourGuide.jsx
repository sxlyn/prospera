import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Joyride, STATUS, ACTIONS } from 'react-joyride';

function TourGuide() {
    const [run, setRun] = useState(false);

    const steps = [
        {
            target: 'body',
            content: (
                <div className="text-center p-2">
                    <h5 className="fw-bold mb-3 text-dark">Selamat Datang di Prospera! 👋</h5>
                    <p className="text-muted mb-0" style={{ fontSize: '14px' }}>Sistem Point of Sales & Analitik pintar untuk UMKM kelas Enterprise. Mari ikuti tur singkat ini untuk menguasai Prospera dalam 1 menit.</p>
                </div>
            ),
            placement: 'center',
            disableBeacon: true,
        },
        {
            target: '[data-tour="tour-products"]',
            content: (
                <div className="p-1">
                    <h6 className="fw-bold text-primary mb-2"><i className="fas fa-box-open me-2"></i>Produk & Inventaris</h6>
                    <p className="text-muted mb-0" style={{ fontSize: '13px' }}>Langkah pertama Anda: Daftarkan barang dagangan, atur harga modal, dan pantau peringatan kedaluwarsa di sini.</p>
                </div>
            ),
            placement: 'right',
            disableBeacon: true,
        },
        {
            target: '[data-tour="tour-transactions"]',
            content: (
                <div className="p-1">
                    <h6 className="fw-bold text-success mb-2"><i className="fas fa-cash-register me-2"></i>Kasir & Transaksi</h6>
                    <p className="text-muted mb-0" style={{ fontSize: '13px' }}>Setelah produk terdaftar, gunakan fitur kasir otomatis ini untuk mencatat setiap penjualan dengan sangat cepat.</p>
                </div>
            ),
            placement: 'right',
            disableBeacon: true,
        },
        {
            target: '[data-tour="tour-sales-summary"]',
            content: (
                <div className="p-1">
                    <h6 className="fw-bold text-info mb-2"><i className="fas fa-chart-bar me-2"></i>Analitik Otomatis</h6>
                    <p className="text-muted mb-0" style={{ fontSize: '13px' }}>Setiap transaksi akan langsung dihitung menjadi Laporan Penjualan dan Laba-Rugi secara real-time!</p>
                </div>
            ),
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '[data-tour="tour-fraud"]',
            content: (
                <div className="p-1">
                    <h6 className="fw-bold text-danger mb-2"><i className="fas fa-shield-alt me-2"></i>Deteksi Fraud</h6>
                    <p className="text-muted mb-0" style={{ fontSize: '13px' }}>Sistem otomatis mendeteksi transaksi anomali, seperti pegawai yang menjual barang di bawah harga modal dan transaksi di luar jam operasional, untuk mencegah kerugian atau kecurangan.</p>
                </div>
            ),
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '[data-tour="tour-ai-insight"]',
            content: (
                <div className="p-1">
                    <h6 className="fw-bold text-warning mb-2" style={{ color: '#eab308' }}><i className="fas fa-robot me-2"></i>Asisten AI Cerdas</h6>
                    <p className="text-muted mb-0" style={{ fontSize: '13px' }}>Kehabisan stok? Jangan khawatir, AI Prospera akan memprediksi penjualan bulan depan dan menyarankan produk apa saja yang wajib di-restock.</p>
                </div>
            ),
            placement: 'top',
            disableBeacon: true,
        }
    ];

    const location = useLocation();

    // Inisialisasi tur HANYA jika berada di halaman Dashboard
    useEffect(() => {
        const hasSeenTour = localStorage.getItem('tourCompleted');
        if (!hasSeenTour && location.pathname === '/dashboard') {
            const timer = setTimeout(() => {
                setRun(true);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [location.pathname]);

    // Jika pengguna pindah halaman saat tur sedang berjalan, batalkan tur secara halus
    useEffect(() => {
        if (run && location.pathname !== '/dashboard') {
            setRun(false);
            localStorage.setItem('tourCompleted', 'true');
        }
    }, [location.pathname, run]);

    // Dengarkan event dari tombol "Ulangi Panduan"
    useEffect(() => {
        const handleReplay = () => {
            setRun(true);
        };
        window.addEventListener('replayTour', handleReplay);
        return () => window.removeEventListener('replayTour', handleReplay);
    }, []);

    const handleJoyrideCallback = (data) => {
        const { status, action, type } = data;
        const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status) || action === ACTIONS.CLOSE || type === 'tour:end') {
            setRun(false);
            localStorage.setItem('tourCompleted', 'true');
        }
    };

    return (
        <>
            <Joyride
                steps={steps}
                run={run}
                continuous={true}
                scrollToFirstStep={true}
                showSkipButton={true}
                showProgress={true}
                spotlightClicks={false}
                disableOverlayClose={true}
                callback={handleJoyrideCallback}
                styles={{
                    options: {
                        primaryColor: '#0d6efd',
                        zIndex: 10000,
                    },
                    buttonNext: {
                        borderRadius: '20px',
                        padding: '8px 16px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                    },
                    buttonBack: {
                        marginRight: 10,
                        fontSize: '14px',
                        color: '#6c757d'
                    },
                    buttonSkip: {
                        fontSize: '14px',
                        color: '#6c757d'
                    },
                    tooltipContainer: {
                        textAlign: 'left'
                    }
                }}
                locale={{
                    back: 'Kembali',
                    close: 'Tutup',
                    last: 'Selesai',
                    next: 'Lanjut',
                    skip: 'Lewati Tur',
                }}
            />
        </>
    );
}

export default TourGuide;
