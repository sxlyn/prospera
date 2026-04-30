const { Transaction } = require('../models');
const { Sequelize, Op } = require('sequelize');

// untuk menghitung prediksi penjualan harian 
const getForecast = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("USER ID:", userId);

    // ambil semua data transaksi 
    const allData = await Transaction.findAll({
      attributes: ['transaction_datetime', 'total_amount', 'status'],
      where: { user_id_fk: userId },
      raw: true
    });
    console.log("SEMUA DATA:", allData);

    const timeZoneAdj = "transaction_datetime + INTERVAL 7 HOUR";

    // ambil 7 data terakhir
    const dailyData = await Transaction.findAll({
      attributes: [
        // ambil tanggal saja 
        [Sequelize.literal(`DATE(${timeZoneAdj})`), 'date'],

        // jumlahkan total transaksi per hari
        [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'daily_total']
      ],
      where: {
        // filter berdasarkan user login
        user_id_fk: userId,

        //  filter hanya transaksi yang berhasil 
        status: 'success',

        // ambil data hanya 7 hari terakhir
        [Op.and]: Sequelize.literal(
          `${timeZoneAdj} >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
        )
      },

      // grouping berdasarkan tanggal (per hari)
      group: [Sequelize.literal(`DATE(${timeZoneAdj})`)],
      raw: true
    });

    console.log("DATA HASIL QUERY:", dailyData);

    // jika tidak ada data maka return 0
    if (dailyData.length === 0) {
      return res.status(200).json({
        message: "Prediksi penjualan harian",
        prediction: 0
      });
    }

    // hitung rata-rata awal
    let total = 0;
    dailyData.forEach(item => {
      total += Number(item.daily_total);
    });

    const avg = total / dailyData.length;

    console.log("AVG:", avg);

    // batas outlier (2x dari rata-rata)
    const threshold = avg * 2;
    console.log("BATAS OUTLIER:", threshold);

    // untuk mendeteksi outlier
    dailyData.forEach(item => {
      if (Number(item.daily_total) > threshold) {
        console.log("OUTLIER:", item);
      }
    });

    // untuk buang data outliernya 
    const filteredData = dailyData.filter(item => {
      return Number(item.daily_total) <= threshold;
    });

    console.log("FILTERED:", filteredData);

    // hitung kembali rata-rata tanpa outlier
    let finalTotal = 0;
    filteredData.forEach(item => {
      finalTotal += Number(item.daily_total);
    });

    const prediction = filteredData.length > 0
      ? Math.round(finalTotal / filteredData.length)
      : Math.round(avg); // fallback jika semua data terhapus

    res.status(200).json({
      message: "Prediksi penjualan harian (7 hari terakhir, tanpa outlier, hanya transaksi sukses)",
      prediction: `Rp ${prediction}`
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Terjadi kesalahan internal pada server."
    });
  }
};

module.exports = { getForecast };