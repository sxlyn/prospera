const { Transaction } = require('../models');
const { Sequelize, Op } = require('sequelize');

// Menghitung prediksi penjualan harian berdasarkan rata-rata 7 hari terakhir (tanpa outlier)
const getForecast = async (req, res, next) => {
  try {
    const userId = req.user.store_id;
    const moment = require('moment-timezone');

    // FIX (BUG-A06): Ganti `transaction_datetime + INTERVAL 7 HOUR` yang hardcoded.
    // SEBELUMNYA: + INTERVAL 7 HOUR mengasumsikan server selalu UTC. Jika MySQL session
    //             timezone dikonfigurasi WIB, penambahan 7 jam menjadi double-shift (+14 jam).
    // SESUDAH   :
    //   1. CONVERT_TZ dengan fixed-offset notation (+00:00 → +07:00) tidak memerlukan
    //      MySQL timezone tables dan bekerja di semua provider cloud.
    //   2. Batas 7 hari dihitung di Node.js dengan moment-timezone WIB agar konsisten
    //      dengan seluruh codebase, bukan bergantung pada DATE_SUB(NOW()) server.
    const timeZoneAdj = "CONVERT_TZ(transaction_datetime, '+00:00', '+07:00')";
    const sevenDaysAgo = moment().tz('Asia/Jakarta').subtract(7, 'days').startOf('day').toDate();

    const dailyData = await Transaction.findAll({
      attributes: [
        [Sequelize.literal(`DATE(${timeZoneAdj})`), 'date'],
        [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'daily_total']
      ],
      where: {
        user_id_fk: userId,
        status: 'success',
        transaction_datetime: { [Op.gte]: sevenDaysAgo }
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