'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('StoreSettings', {
      setting_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id_fk: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        unique: true
      },
      open_hour: {
        type: Sequelize.TIME,
        allowNull: false,
        defaultValue: '08:00:00'
      },
      close_hour: {
        type: Sequelize.TIME,
        allowNull: false,
        defaultValue: '22:00:00'
      },
      grace_period_minutes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 30
      },
      is_overtime_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      emergency_pin: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('StoreSettings');
  }
};
