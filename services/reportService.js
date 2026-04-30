const ExcelJS = require('exceljs');

class BaseReport {
    constructor(reportData) {
        this.summary = reportData.summary;
        this.breakdown = reportData.status_breakdown;
        this.details = reportData.details;
    }

    formatRupiah(angka) {
        return `Rp ${parseInt(angka).toLocaleString('id-ID')}`;
    }
}

class ExcelReport extends BaseReport {
    async generate() {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Laporan Prospera');

        sheet.getColumn('A').width = 30; // Nama Produk
        sheet.getColumn('B').width = 12; // Terjual
        sheet.getColumn('C').width = 18; // Harga Satuan
        sheet.getColumn('D').width = 18; // Subtotal
        sheet.getColumn('E').width = 18; // Profit (Rp)
        sheet.getColumn('F').width = 15; // Margin (%)

        //HEADER & SUMMARY
        sheet.addRow(['LAPORAN PENJUALAN PROSPERA']).font = { bold: true, size: 14 };
        sheet.addRow([]); 
        
        sheet.addRow(['RINGKASAN']).font = { bold: true };
        sheet.addRow(['Total Transaksi', this.summary.total_transaction]);
        sheet.addRow(['Produk Terjual', this.summary.items_sold]);
        sheet.addRow(['Total Omzet', this.formatRupiah(this.summary.revenue)]);
        sheet.addRow(['Total Profit', this.formatRupiah(this.summary.total_profit)]);
        sheet.addRow([]);

        //STATUS BREAKDOWN
        sheet.addRow(['STATUS TRANSAKSI']).font = { bold: true };
        sheet.addRow(['Sukses', this.breakdown.success]);
        sheet.addRow(['Dibatalkan', this.breakdown.cancelled]);
        sheet.addRow([]);

        //TABEL DETAIL PRODUK
        sheet.addRow(['RINCIAN ANALISIS PRODUK']).font = { bold: true };
        
        const tableHeader = sheet.addRow([
            'Nama Produk', 
            'Terjual', 
            'Harga Satuan', 
            'Subtotal', 
            'Profit (Rp)', 
            'Margin (%)'
        ]);
        
        tableHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        tableHeader.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } }; // Biru Elegan
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        // Isi Data
        if (this.details && this.details.length > 0) {
            this.details.forEach(item => {
                const row = sheet.addRow([
                    item.name,
                    item.qty,
                    this.formatRupiah(item.unitPrice),
                    this.formatRupiah(item.subtotal),
                    this.formatRupiah(item.profit),
                    item.margin
                ]);
                row.getCell(6).alignment = { horizontal: 'center' }; // Center margin %
            });
        } else {
            sheet.addRow(['Tidak ada produk terjual']);
        }

        return await workbook.xlsx.writeBuffer();
    }
}


class CsvReport extends BaseReport {
    async generate() {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Data');

        // Header CSV
        sheet.addRow(['Nama Produk', 'Terjual', 'Harga Satuan', 'Subtotal', 'Profit', 'Margin (%)']);

        // Isi Data 
        if (this.details && this.details.length > 0) {
            this.details.forEach(item => {
                sheet.addRow([
                    item.name,
                    item.qty,
                    item.unitPrice, 
                    item.subtotal,
                    item.profit,
                    item.margin.replace('%', '') // Hapus tanda % biar murni angka
                ]);
            });
        }

        return await workbook.csv.writeBuffer();
    }
}

module.exports = { ExcelReport, CsvReport };

