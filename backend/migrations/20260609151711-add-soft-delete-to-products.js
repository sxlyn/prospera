'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Menambahkan kolom timestamps (createdAt, updatedAt, deletedAt) untuk fitur Soft Delete
    await queryInterface.addColumn('Products', 'createdAt', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });
    
    await queryInterface.addColumn('Products', 'updatedAt', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    });

    await queryInterface.addColumn('Products', 'deletedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null
    });
  },

  async down(queryInterface, Sequelize) {
    // Rollback: Hapus kolom timestamps dari tabel Products
    await queryInterface.removeColumn('Products', 'createdAt');
    await queryInterface.removeColumn('Products', 'updatedAt');
    await queryInterface.removeColumn('Products', 'deletedAt');
  }
};
