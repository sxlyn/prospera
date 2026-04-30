'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('Transaction_details', {
      detail_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      transaction_id_fk: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Transactions',
          key: 'transaction_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      product_id_fk: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Products',
          key: 'product_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      quantity: {
        type: Sequelize.INTEGER
      },
      capital_cost: {
        type: Sequelize.INTEGER
      },
      selling_price: {
        type: Sequelize.INTEGER
      },
      sub_total: {
        type: Sequelize.INTEGER
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('Transaction_details');
  }
};