'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    await queryInterface.bulkInsert('Categories', [
      {
        category_id: 1,
        user_id_fk: 1,
        category_name: 'Makanan Ringan',
        requires_expired_date: true,
        createdAt: now,
        updatedAt: now
      },
      {
        category_id: 2,
        user_id_fk: 1,
        category_name: 'Minuman',
        requires_expired_date: true,
        createdAt: now,
        updatedAt: now
      },
      {
        category_id: 3,
        user_id_fk: 1,
        category_name: 'Sembako',
        requires_expired_date: true,
        createdAt: now,
        updatedAt: now
      },
      {
        category_id: 4,
        user_id_fk: 1,
        category_name: 'Perawatan Tubuh',
        requires_expired_date: false,
        createdAt: now,
        updatedAt: now
      },
      {
        category_id: 5,
        user_id_fk: 1,
        category_name: 'Kebutuhan Rumah Tangga',
        requires_expired_date: false,
        createdAt: now,
        updatedAt: now
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Categories', null, {});
  }
};
