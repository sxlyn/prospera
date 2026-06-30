'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    await queryInterface.bulkInsert('StoreSettings', [
      {
        setting_id: 1,
        user_id_fk: 1,
        open_hour: '08:00:00',
        close_hour: '22:00:00',
        grace_period_minutes: 15,
        is_overtime_active: false,
        emergency_pin: '123456',
        createdAt: now,
        updatedAt: now
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('StoreSettings', null, {});
  }
};
