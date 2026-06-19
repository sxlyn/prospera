import React, { useState, useEffect } from 'react';
import { getAnomalies, formatError } from '../utils/api';
import { formatRupiah } from '../utils/format';

function FraudDetectionWidget() {
    const [anomalies, setAnomalies] = useState({ timeAnomalies: [], priceAnomalies: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAnomalies();
    }, []);

    const fetchAnomalies = async () => {
        try {
            setLoading(true);
            const data = await getAnomalies();
            setAnomalies(data);
            setError(null);
        } catch (err) {
            setError(formatError(err));
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="card shadow-sm mb-4"><div className="card-body">Memuat data deteksi anomali...</div></div>;
    }

    if (error) {
        return <div className="alert alert-danger mb-4">{error}</div>;
    }

    const hasAnomalies = anomalies.timeAnomalies.length > 0 || anomalies.priceAnomalies.length > 0;

    if (!hasAnomalies) {
        // Return null atau pesan "Semua aman"
        return (
            <div className="card shadow-sm border-start border-success border-4 mb-4">
                <div className="card-body">
                    <h5 className="card-title text-success fw-bold mb-0">
                        <i className="fas fa-shield-check me-2"></i>Fraud Detection Aktif
                    </h5>
                    <p className="text-muted small mt-2 mb-0">Sistem memantau 24/7. Tidak ditemukan aktivitas mencurigakan pada transaksi 30 hari terakhir.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card shadow-sm border-start border-danger border-4 mb-4">
            <div className="card-body">
                <h5 className="card-title text-danger fw-bold mb-3">
                    <i className="fas fa-siren-on me-2"></i>Deteksi Anomali / Red Flags (30 Hari Terakhir)
                </h5>

                {anomalies.timeAnomalies.length > 0 && (
                    <div className="mb-4">
                        <h6 className="fw-bold text-dark"><i className="fas fa-clock text-warning me-2"></i>Anomali Waktu (Aktivitas di Luar Jam)</h6>
                        <div className="table-responsive">
                            <table className="table table-sm table-hover align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>ID Transaksi</th>
                                        <th>Waktu</th>
                                        <th>Kasir</th>
                                        <th>Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {anomalies.timeAnomalies.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>#{item.transaction_id}</td>
                                            <td>
                                                <div className="fw-semibold">{new Date(item.datetime).toLocaleDateString('id-ID')}</div>
                                                <div className="text-danger small fw-bold">{item.time}</div>
                                            </td>
                                            <td>{item.cashier}</td>
                                            <td className="text-muted small">{item.reason}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {anomalies.priceAnomalies.length > 0 && (
                    <div>
                        <h6 className="fw-bold text-dark"><i className="fas fa-tags text-danger me-2"></i>Anomali Harga (Jual Rugi / Margin Tipis)</h6>
                        <div className="table-responsive">
                            <table className="table table-sm table-hover align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>ID Transaksi / Kasir</th>
                                        <th>Produk</th>
                                        <th>Harga Modal</th>
                                        <th>Harga Jual</th>
                                        <th>Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {anomalies.priceAnomalies.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <div className="fw-semibold">#{item.transaction_id}</div>
                                                <div className="small text-muted">{item.cashier}</div>
                                            </td>
                                            <td>{item.product}</td>
                                            <td>{formatRupiah(item.capital_cost)}</td>
                                            <td>
                                                <span className="text-danger fw-bold">{formatRupiah(item.selling_price)}</span>
                                            </td>
                                            <td>
                                                <span className="badge bg-danger">Margin: {item.margin_percentage}%</span>
                                                <div className="text-muted small mt-1">{item.reason}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default FraudDetectionWidget;
