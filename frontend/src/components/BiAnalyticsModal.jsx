/**
 * BiAnalyticsModal.jsx — Modal komponen untuk halaman BI Analytics
 * REFACTOR (F-T01): Diekstrak dari BiAnalytics.jsx (monster 425 baris)
 * 
 * Menangani rendering 4 tipe modal:
 * - 'pnl'         → Kalkulasi Laba Rugi (P&L)
 * - 'loss'        → Rincian Barang Rugi
 * - 'profit'      → Rincian Penyumbang Laba
 * - 'transaction'  → Status Transaksi Breakdown
 */

import { formatRupiah } from '../utils/format';

/**
 * Render konten P&L (Profit & Loss)
 */
function PnlContent({ ringkasan }) {
    return (
        <div className="p-4 bg-white">
            <div className="mb-4 p-3 rounded" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span className="d-block text-muted mb-1" style={{fontSize: "14px"}}>Total Pendapatan Kotor (Omzet)</span>
                <span className="fw-bold text-dark" style={{fontSize: "20px"}}>{formatRupiah(ringkasan.penjualan)}</span>
            </div>
            
            <h6 className="fw-bold text-secondary mb-3"><i className="fas fa-list me-2"></i>Rincian Kalkulasi:</h6>
            <div className="d-flex justify-content-between mb-2">
                <span className="text-muted" style={{fontSize: "16px"}}>Laba Kotor (Untung)</span>
                <span className="fw-bold text-success" style={{fontSize: "16px"}}>{formatRupiah(ringkasan.labaKotor)}</span>
            </div>
            <div className="d-flex justify-content-between mb-3 pb-3 border-bottom border-2">
                <span className="text-muted" style={{fontSize: "16px"}}>Kerugian (Jual Rugi)</span>
                <span className="fw-bold text-danger" style={{fontSize: "16px"}}>-{formatRupiah(ringkasan.rugi)}</span>
            </div>
            <div className="d-flex justify-content-between mt-3">
                <span className="fw-bold text-dark" style={{ fontSize: "1.2rem" }}>Total Laba Bersih</span>
                <span className="fw-bold text-primary" style={{ fontSize: "1.2rem" }}>{formatRupiah(ringkasan.labaBersih)}</span>
            </div>
        </div>
    );
}

/**
 * Render tabel berdasarkan tipe modal (loss, profit, transaction)
 */
function TableContent({ type, data }) {
    return (
        <div className="table-responsive">
            <table className="table table-striped table-hover align-middle mb-0">
                <thead className="table-light">
                    {type === 'loss' ? (
                        <tr className="small text-muted text-uppercase">
                            <th className="ps-4">Nama Barang</th>
                            <th className="text-center">Vol</th>
                            <th className="text-end">Modal/Unit</th>
                            <th className="text-end">Jual/Unit</th>
                            <th className="text-end pe-4">Total Rugi</th>
                        </tr>
                    ) : type === 'profit' ? (
                        <tr className="small text-muted text-uppercase">
                            <th className="ps-4">Nama Barang</th>
                            <th className="text-center">Vol</th>
                            <th className="text-end">Total Omzet</th>
                            <th className="text-center">Margin</th>
                            <th className="text-end pe-4">Total Laba</th>
                        </tr>
                    ) : (
                        <tr className="small text-muted text-uppercase">
                            <th className="ps-4">Status Transaksi</th>
                            <th className="text-end pe-4">Total Struk</th>
                        </tr>
                    )}
                </thead>
                <tbody>
                    {type === 'loss' && data.lossProducts.length > 0 ? (
                        data.lossProducts.map((item, idx) => (
                            <tr key={idx}>
                                <td className="ps-4 fw-bold text-dark">{item.product_name}</td>
                                <td className="text-center">{item.sold}</td>
                                <td className="text-end text-muted">{formatRupiah(item.modal)}</td>
                                <td className="text-end text-muted">{formatRupiah(item.harga_jual)}</td>
                                <td className="text-end pe-4 text-danger fw-bold">-{formatRupiah(item.rugi)}</td>
                            </tr>
                        ))
                    ) : type === 'loss' ? (
                        <tr><td colSpan="5" className="text-center py-4">Tidak ada barang yang dijual rugi. Mantap!</td></tr>
                    ) : null}

                    {type === 'profit' && data.products.length > 0 ? (
                        data.products.map((item, idx) => (
                            <tr key={idx}>
                                <td className="ps-4 fw-bold text-dark">{item.product_name}</td>
                                <td className="text-center">{item.sold}</td>
                                <td className="text-end text-muted">{formatRupiah(item.revenue)}</td>
                                <td className="text-center text-primary fw-bold">{item.margin}</td>
                                <td className="text-end pe-4 text-success fw-bold">{formatRupiah(item.laba)}</td>
                            </tr>
                        ))
                    ) : type === 'profit' ? (
                        <tr><td colSpan="5" className="text-center py-4">Belum ada data penjualan.</td></tr>
                    ) : null}

                    {type === 'transaction' && (
                        <>
                            <tr>
                                <td className="ps-4 fw-bold text-success"><i className="fas fa-check-circle me-2"></i>Berhasil (Success)</td>
                                <td className="text-end pe-4 fw-bold text-dark">{data.status_breakdown?.success || 0}</td>
                            </tr>
                            <tr>
                                <td className="ps-4 fw-bold text-warning"><i className="fas fa-clock me-2"></i>Tertunda (Pending)</td>
                                <td className="text-end pe-4 fw-bold text-dark">{data.status_breakdown?.pending || 0}</td>
                            </tr>
                            <tr>
                                <td className="ps-4 fw-bold text-danger"><i className="fas fa-times-circle me-2"></i>Dibatalkan (Cancelled)</td>
                                <td className="text-end pe-4 fw-bold text-dark">{data.status_breakdown?.cancelled || 0}</td>
                            </tr>
                        </>
                    )}
                </tbody>
            </table>
        </div>
    );
}

// Konfigurasi warna & ikon berdasarkan tipe modal
const MODAL_THEMES = {
    loss:        { bg: 'bg-danger',  icon: 'fa-exclamation-triangle' },
    transaction: { bg: 'bg-primary', icon: 'fa-receipt' },
    pnl:         { bg: 'bg-dark',    icon: 'fa-calculator' },
    profit:      { bg: 'bg-success', icon: 'fa-trophy' }
};

/**
 * Komponen modal utama
 * @param {{ modalConfig, closeModal, data, ringkasan }} props
 */
export default function BiAnalyticsModal({ modalConfig, closeModal, data, ringkasan }) {
    if (!modalConfig.isOpen) return null;

    const theme = MODAL_THEMES[modalConfig.type] || MODAL_THEMES.profit;

    return (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg">
                    <div className={`modal-header text-white ${theme.bg}`}>
                        <h5 className="modal-title fw-bold">
                            <i className={`fas ${theme.icon} me-2`}></i>
                            {modalConfig.title}
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
                    </div>
                    
                    <div className="modal-body p-0">
                        {modalConfig.type === 'pnl' ? (
                            <PnlContent ringkasan={ringkasan} />
                        ) : (
                            <TableContent type={modalConfig.type} data={data} />
                        )}
                    </div>
                    <div className="modal-footer bg-light border-0">
                        <button type="button" className="btn btn-secondary" onClick={closeModal}>Tutup</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
