'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Menambahkan kolom 'role' ke tabel Users dengan ENUM('owner','kasir')
    // seperti pada script migrasi manual aslinya.
    // (Perubahan ENUM dari 'kasir' ke 'karyawan' ditangani oleh file migrasi rename-kasir-to-karyawan)
    try {
      await queryInterface.addColumn('Users', 'role', {
        type: Sequelize.ENUM('owner', 'kasir'),
        allowNull: false,
        defaultValue: 'owner'
      });
    } catch (error) {
      if (!error.message.includes("Duplicate column name")) {
        throw error;
      }
      console.log("Kolom 'role' sudah ada, melewati migrasi ini.");
    }
  },

  async down(queryInterface, Sequelize) {
    // Rollback: Hapus kolom 'role' dari tabel Users
    await queryInterface.removeColumn('Users', 'role');
  }
};
