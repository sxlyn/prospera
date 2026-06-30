'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    let bcryptLib;
    try { bcryptLib = require('bcryptjs'); } catch (e) { bcryptLib = require('bcrypt'); }
    const hash = await bcryptLib.hash('password123', 10);
    const now = new Date();

    await queryInterface.bulkInsert('Users', [
      {
        user_id: 1,
        username: 'Bapak Budi Hartono',
        email: 'prospera01@gmail.com',
        password: hash,
        role: 'owner',
        owner_id: null,
        overtime_unlocked_until: null,
        has_completed_tour: true,
        phone_number: '081234567890',
        is_active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        user_id: 2,
        username: 'Siti Aminah',
        email: 'siti.aminah@prospera.com',
        password: hash,
        role: 'karyawan',
        owner_id: 1,
        overtime_unlocked_until: null,
        has_completed_tour: true,
        phone_number: '081234567891',
        is_active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        user_id: 3,
        username: 'Reza Fahlevi',
        email: 'reza.fahlevi@prospera.com',
        password: hash,
        role: 'karyawan',
        owner_id: 1,
        overtime_unlocked_until: null,
        has_completed_tour: true,
        phone_number: '081234567892',
        is_active: true,
        createdAt: now,
        updatedAt: now
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
