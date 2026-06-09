'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // 1. Ubah ENUM agar menerima nilai baru 'karyawan'
    await queryInterface.sequelize.query(
      "ALTER TABLE Users MODIFY COLUMN `role` ENUM('owner','kasir','karyawan') NOT NULL DEFAULT 'owner'"
    );
    // 2. Ubah semua data 'kasir' menjadi 'karyawan'
    await queryInterface.sequelize.query(
      "UPDATE Users SET `role` = 'karyawan' WHERE `role` = 'kasir'"
    );
    // 3. Hapus opsi lama 'kasir' dari ENUM
    await queryInterface.sequelize.query(
      "ALTER TABLE Users MODIFY COLUMN `role` ENUM('owner','karyawan') NOT NULL DEFAULT 'owner'"
    );
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      "ALTER TABLE Users MODIFY COLUMN `role` ENUM('owner','karyawan','kasir') NOT NULL DEFAULT 'owner'"
    );
    await queryInterface.sequelize.query(
      "UPDATE Users SET `role` = 'kasir' WHERE `role` = 'karyawan'"
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE Users MODIFY COLUMN `role` ENUM('owner','kasir') NOT NULL DEFAULT 'owner'"
    );
  }
};
