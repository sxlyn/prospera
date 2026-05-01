import { useState } from 'react';
import TrendChart from '../components/TrendChart';
import { biData } from '../data/biData';
import { formatRupiah } from '../utils/format';

function BiAnalytics() {
    const [view, setView] = useState('list');
    const [period, setPeriod] = useState('monthly');
    const margin = ((biData.ringkasan.laba / biData.ringkasan.penjualan) * 100).toFixed(1);
    const trend = biData.tren[period];
    const chartSales = trend.data.map((value) => value * 1000000);
    const chartProfit = trend.laba.map((value) => value * 1000000);

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold m-0">Analitik Bisnis (BI)</h3>
            </div>
            <div className="row g-4">
                <div className="col-lg-4 col-md-5">
                    <div className="mb-3">
                        <span className="badge bg-secondary mb-2">Sales Summary</span>
                        <div className="stat-card bi-card shadow-sm mb-3">
                            <small className="text-muted">Total Pendapatan</small>
                            <div className="h4 fw-bold">{formatRupiah(biData.ringkasan.penjualan)}</div>
                        </div>
                        <div className="stat-card bi-card shadow-sm mb-3">
                            <small className="text-muted">Jumlah Transaksi</small>
                            <div className="h4 fw-bold">{biData.ringkasan.transaksi.toLocaleString('id-ID')}</div>
                        </div>
                    </div>
                    <div className="mb-3">
                        <span className="badge bg-primary mb-2">Profit & Loss Tracking</span>
                        <div className="stat-card bi-card shadow-sm mb-3">
                            <small className="text-muted">Laba Bersih (P&L)</small>
                            <div className="h4 fw-bold text-success">{formatRupiah(biData.ringkasan.laba)}</div>
                        </div>
                        <div className="stat-card bi-card shadow-sm mb-3">
                            <small className="text-muted">Margin Keuntungan</small>
                            <div className="h4 fw-bold text-primary">{margin}%</div>
                        </div>
                    </div>
                </div>
                <div className="col-lg-8 col-md-7">
                    <ul className="nav nav-pills mb-4 bg-white p-2 rounded shadow-sm">
                        <li className="nav-item">
                            <button className={`nav-link ${view === 'list' ? 'active' : ''}`} type="button" onClick={() => setView('list')}>
                                <i className="fas fa-boxes me-2" />Daftar Barang Penjualan
                            </button>
                        </li>
                        <li className="nav-item">
                            <button className={`nav-link ${view === 'chart' ? 'active' : ''}`} type="button" onClick={() => setView('chart')}>
                                <i className="fas fa-chart-area me-2" />Analisis Tren
                            </button>
                        </li>
                    </ul>

                    {view === 'list' ? (
                        <div className="card border-0 shadow-sm p-4">
                                <h5 className="fw-bold mb-4"><span className="badge bg-success me-2">Top</span>Performa Penjualan Barang</h5>
                            <div className="table-responsive">
                                <table className="table table-borderless align-middle">
                                    <thead className="bg-light">
                                        <tr className="small text-muted text-uppercase">
                                            <th>Nama Barang</th>
                                            <th className="text-center">Volume</th>
                                            <th className="text-end">Kontribusi Laba</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {biData.performa.map((item) => (
                                            <tr key={item.nama}>
                                                <td><div className="fw-bold">{item.nama}</div></td>
                                                <td className="text-center">{item.volume.toLocaleString('id-ID')} unit</td>
                                                <td className="text-end text-success fw-bold">{formatRupiah(item.laba)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="card border-0 shadow-sm p-4">
                            <div className="d-flex justify-content-between mb-4">
                                <h5 className="fw-bold"><span className="badge bg-info me-2">Tren</span>Tren Penjualan & Laba</h5>
                                <select className="form-select form-select-sm w-auto" value={period} onChange={(event) => setPeriod(event.target.value)}>
                                    <option value="monthly">Tren Bulanan</option>
                                    <option value="daily">Tren Harian (April)</option>
                                </select>
                            </div>
                            <div className="chart-container">
                                <TrendChart labels={trend.labels} sales={chartSales} profit={chartProfit} salesLabel="Penjualan" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default BiAnalytics;
