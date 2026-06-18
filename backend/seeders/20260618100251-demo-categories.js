'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Cari user pertama (owner) untuk dijadikan referensi
    const users = await queryInterface.sequelize.query(
      `SELECT user_id from Users LIMIT 1;`
    );

    const userRows = users[0];

    // Jika tidak ada user, lewati seeder (karena user_id_fk NOT NULL)
    if (userRows.length === 0) {
      console.log("No users found. Skipping category seeding.");
      return;
    }

    const defaultOwnerId = userRows[0].user_id;

    await queryInterface.bulkInsert('Categories', [
      {
        user_id_fk: defaultOwnerId,
        category_name: 'Makanan / Minuman',
        requires_expired_date: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        user_id_fk: defaultOwnerId,
        category_name: 'Obat-obatan / Farmasi',
        requires_expired_date: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        user_id_fk: defaultOwnerId,
        category_name: 'Alat Tulis Kantor',
        requires_expired_date: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        user_id_fk: defaultOwnerId,
        category_name: 'Peralatan Rumah Tangga',
        requires_expired_date: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Categories', null, {});
  }
};
