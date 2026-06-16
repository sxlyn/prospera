'use strict';
const bcrypt = require('bcryptjs');

/**
 * Seeder: Users
 * SECURITY FIX (B-T11): Password sudah di-hash, role & owner_id diatur eksplisit.
 * Sebelumnya: password plaintext, tanpa role/owner_id → user tidak bisa login dengan benar.
 * 
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up (queryInterface, Sequelize) {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('password123', salt);

    await queryInterface.bulkInsert('Users', [{
      username: 'prospera01',
      email: 'prospera01@gmail.com',
      password: hashedPassword,
      role: 'owner',      // B-T11: Eksplisit set role
      owner_id: null,      // B-T11: Owner tidak punya owner_id (dia sendiri pemilik)
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', { email: 'prospera01@gmail.com' }, {});
  }
};