const { Transaction } = require('../models');
const { Sequelize, Op } = require('sequelize');

// Menghitung prediksi penjualan harian berdasarkan rata-rata 7 hari terakhir (tanpa outlier)
const getForecast = async (req, res, next) => {
  try {
    const userId = req.user.store_id;

    const timeZoneAdj = "transaction_datetime + INTERVAL 7 HOUR";

    // Ambil data penjualan harian 7 hari terakhir (hanya transaksi sukses)
    const dailyData = await Transaction.findAll({
      attributes: [
        [Sequelize.literal(`DATE(${timeZoneAdj})`), 'date'],
        [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'daily_total']
      ],
      where: {
        user_id_fk: userId,
        status: 'success',
        [Op.and]: Sequelize.literal(
          `${timeZoneAdj} >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
        )
      },
      group: [Sequelize.literal(`DATE(${timeZoneAdj})`)],
      raw: true
    });

    // Jika tidak ada data, kembalikan prediksi 0
    if (dailyData.length === 0) {
      return res.status(200).json({
        message: "Prediksi penjualan harian",
        prediction: 0
      });
    }

    // Hitung rata-rata awal untuk menentukan batas outlier
    let total = 0;
    dailyData.forEach(item => {
      total += Number(item.daily_total);
    });
    const avg = total / dailyData.length;

    // Batas outlier: 2x dari rata-rata
    const threshold = avg * 2;

    // Buang data outlier
    const filteredData = dailyData.filter(item => {
      return Number(item.daily_total) <= threshold;
    });

    // Hitung kembali rata-rata tanpa outlier
    let finalTotal = 0;
    filteredData.forEach(item => {
      finalTotal += Number(item.daily_total);
    });

    const prediction = filteredData.length > 0
      ? Math.round(finalTotal / filteredData.length)
      : Math.round(avg); // Fallback jika semua data terdeteksi outlier

    res.status(200).json({
      message: "Prediksi penjualan harian (7 hari terakhir, tanpa outlier, hanya transaksi sukses)",
      prediction: `Rp ${prediction}`
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { getForecast };