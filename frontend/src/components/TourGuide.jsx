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
                    <h5 className="fw-bold mb-3">Selamat Datang di Prospera! 👋</h5>
                    <p className="mb-0" style={{ fontSize: '14px', opacity: 0.8 }}>Sistem Point of Sales & Analitik pintar untuk UMKM kelas Enterprise. Mari ikuti tur singkat ini untuk menguasai Prospera dalam 1 menit.</p>
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
                    <p className="mb-0" style={{ fontSize: '13px', opacity: 0.8 }}>Langkah pertama Anda: Daftarkan barang dagangan, atur harga modal, dan pantau peringatan kedaluwarsa di sini.</p>
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
                    <p className="mb-0" style={{ fontSize: '13px', opacity: 0.8 }}>Setelah produk terdaftar, gunakan fitur kasir otomatis ini untuk mencatat setiap penjualan dengan sangat cepat.</p>
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
                    <p className="mb-0" style={{ fontSize: '13px', opacity: 0.8 }}>Setiap transaksi akan langsung dihitung menjadi Laporan Penjualan dan Laba-Rugi secara real-time!</p>
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
                    <p className="mb-0" style={{ fontSize: '13px', opacity: 0.8 }}>Sistem otomatis mendeteksi transaksi anomali, seperti transaksi di luar jam operasional, untuk mencegah kerugian atau kecurangan.</p>
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
                    <p className="mb-0" style={{ fontSize: '13px', opacity: 0.8 }}>Kehabisan stok? Jangan khawatir, AI Prospera akan memprediksi penjualan bulan depan dan menyarankan produk apa saja yang wajib di-restock.</p>
                </div>
            ),
            placement: 'top',
            disableBeacon: true,
        }
    ];

    const location = useLocation();
    const [tourKey, setTourKey] = useState(Date.now()); // FIX: Force remount Joyride on replay

    // Inisialisasi tur HANYA jika berada di halaman Dashboard
    useEffect(() => {
        const hasSeenTour = localStorage.getItem('tourCompleted');
        
        if (!hasSeenTour && location.pathname === '/dashboard') {
            // FIX (Enterprise UX): Segera tandai selesai secara sinkron di milidetik pertama (0ms).
            // Ini mencegah race condition di mana React Strict Mode atau refresh browser (F5) 
            // menggagalkan penyimpanan ke localStorage sebelum animasi setTimeout selesai.
            localStorage.setItem('tourCompleted', 'true');

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
        }
    }, [location.pathname, run]);

    // Dengarkan event dari tombol "Ulangi Panduan"
    useEffect(() => {
        const handleReplay = () => {
            setTourKey(Date.now()); // Ubah key agar Joyride mereset stepIndex-nya ke 0
            setRun(true);
            // FIX: Segera set kembali agar jika user refresh di tengah replay, tidak muncul otomatis
            localStorage.setItem('tourCompleted', 'true');
        };
        window.addEventListener('replayTour', handleReplay);
        return () => window.removeEventListener('replayTour', handleReplay);
    }, []);

    const handleJoyrideCallback = (data) => {
        const { status, action, type } = data;
        const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status) || action === ACTIONS.CLOSE || type === 'tour:end') {
            setRun(false);
            // FIX: Pastikan status ditandai selesai secara permanen
            localStorage.setItem('tourCompleted', 'true');
        }
    };

    // FIX: Buat komponen Tooltip kustom murni menggunakan class Bootstrap
    // Ini memastikan background, teks, dan tombol 100% mengikuti tema Light/Dark
    const CustomTooltip = ({ index, step, backProps, closeProps, primaryProps, skipProps, tooltipProps, isLastStep }) => (
        <div {...tooltipProps} className="card border shadow-lg bg-body text-body" style={{ maxWidth: '400px', zIndex: 10000 }}>
            <div className="card-body p-4">
                {step.content}
            </div>
            <div className="card-footer bg-transparent border-top p-3 d-flex justify-content-between align-items-center">
                <button {...skipProps} className="btn btn-sm btn-link text-decoration-none" style={{ color: 'var(--bs-secondary-color)' }}>
                    Lewati Tur
                </button>
                <div className="d-flex gap-2">
                    {index > 0 && (
                        <button {...backProps} className="btn btn-sm btn-outline-secondary fw-bold px-3 rounded-pill">
                            Kembali
                        </button>
                    )}
                    <button {...primaryProps} className="btn btn-sm btn-primary fw-bold px-3 rounded-pill">
                        {isLastStep ? 'Selesai' : 'Lanjut'}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <Joyride
                key={tourKey}
                steps={steps}
                run={run}
                continuous={true}
                scrollToFirstStep={true}
                showSkipButton={true}
                showProgress={true}
                spotlightClicks={false}
                disableOverlayClose={true}
                callback={handleJoyrideCallback}
                tooltipComponent={CustomTooltip} // <--- Ganti total UI tooltip bawaan dengan komponen murni Bootstrap kita
                styles={{
                    options: {
                        zIndex: 10000,
                    }
                }}
            />
        </>
    );
}

export default TourGuide;
