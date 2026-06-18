'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
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
    } catch (error) {
      if (!error.message.includes("Duplicate column name")) {
        throw error;
      }
      console.log("Kolom timestamps sudah ada, melewati migrasi ini.");
    }
  },

  async down(queryInterface, Sequelize) {
    // Rollback: Hapus kolom timestamps dari tabel Products
    await queryInterface.removeColumn('Products', 'createdAt');
    await queryInterface.removeColumn('Products', 'updatedAt');
    await queryInterface.removeColumn('Products', 'deletedAt');
  }
};
