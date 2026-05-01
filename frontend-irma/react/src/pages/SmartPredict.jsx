import { smartData } from '../data/smartData';
import { formatRupiah } from '../utils/format';

function SmartPredict() {
    const safetyStock = 50;
    const lowStockItems = smartData.inventaris.filter((item) => item.saatIni < safetyStock);
    const forecast = smartData.rataRataHistoris * smartData.tingkatPertumbuhan;

    return (
        <>
            <h3 className="fw-bold mb-4">Fitur Pintar</h3>
            <div className="row g-4">
                <div className="col-md-5 d-flex">
                    <div className="simple-card shadow-sm flex-fill d-flex flex-column justify-content-center">
                        <div className="text-muted small text-uppercase fw-bold mb-2">Sales Forecasting (Mei)</div>
                        <div className="h2 fw-bold mb-2">{formatRupiah(forecast)}</div>
                        <div className="small text-secondary">Perkiraan pendapatan untuk bulan Mei.</div>
                    </div>
                </div>
                <div className="col-md-7 d-flex">
                    <div className="simple-card shadow-sm border-start border-danger border-4 flex-fill">
                        <div className="d-flex align-items-center mb-3">
                            <div className="bg-danger bg-opacity-10 text-danger p-2 rounded-circle me-3">
                                <i className="fas fa-exclamation-triangle" />
                            </div>
                            <h5 className="fw-bold mb-0">Peringatan Inventaris</h5>
                        </div>
                        <div className="d-flex align-items-center">
                            <div className="me-4 pe-4 border-end text-center">
                                <div className="text-muted small mb-1">Produk Kritis</div>
                                <div className="h2 fw-bold text-danger">{lowStockItems.length}</div>
                            </div>
                            <div className="flex-grow-1 small">
                                {lowStockItems.length > 0 ? (
                                    lowStockItems.map((item) => (
                                        <div className="alert-item d-flex justify-content-between align-items-center" key={item.nama}>
                                            <span>{item.nama}</span>
                                            <span className="text-danger fw-bold">{item.saatIni} unit tersisa</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-muted">Semua stok produk saat ini dalam kondisi aman.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-12">
                    <div className="simple-card shadow-sm">
                        <h5 className="fw-bold mb-4">Saran Pembelian Stok (Restock)</h5>
                        <div className="table-responsive">
                            <table className="table table-sm align-middle">
                                <thead className="text-muted">
                                    <tr>
                                        <th>Nama Barang</th>
                                        <th>Stok Saat Ini</th>
                                        <th>Kebutuhan Prediksi</th>
                                        <th>Saran Restock</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {smartData.inventaris.map((item) => {
                                        const disarankan = Math.ceil(item.rataBulanan * 1.2);
                                        const perluDipesan = disarankan - item.saatIni;
                                        return (
                                            <tr key={item.nama}>
                                                <td><div className="fw-bold">{item.nama}</div></td>
                                                <td>{item.saatIni} unit</td>
                                                <td>{disarankan} unit</td>
                                                <td><span className="badge bg-primary">+{perluDipesan} unit</span></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default SmartPredict;
