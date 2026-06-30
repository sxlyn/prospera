'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    
    const anomalyDate1 = new Date(now);
    anomalyDate1.setDate(now.getDate() - 1);
    
    const anomalyDate2 = new Date(now);
    anomalyDate2.setDate(now.getDate() - 3);

    await queryInterface.bulkInsert('Anomaly_Tickets', [
      {
        user_id_fk: 1,
        anomaly_type: 'TIME',
        reference_id: 112, // Dummy transaction reference
        description: 'AI mendeteksi transaksi besar dilakukan oleh Reza Fahlevi (Kasir Malam) pada pukul 03:00 pagi (di luar jam operasional).',
        status: 'OPEN',
        resolution_note: null,
        resolved_at: null,
        resolved_by: null,
        createdAt: anomalyDate1,
        updatedAt: anomalyDate1
      },
      {
        user_id_fk: 1,
        anomaly_type: 'PRICE',
        reference_id: 85, // Dummy transaction reference
        description: 'AI mendeteksi anomali: Reza Fahlevi menjual produk grosir dengan harga jual drastis jauh di bawah margin wajar (Kemungkinan penipuan margin).',
        status: 'RESOLVED',
        resolution_note: 'Sudah diinterogasi, ternyata salah input dari scanner barcode.',
        resolved_at: now,
        resolved_by: 1,
        createdAt: anomalyDate2,
        updatedAt: anomalyDate2
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Anomaly_Tickets', null, {});
  }
};
