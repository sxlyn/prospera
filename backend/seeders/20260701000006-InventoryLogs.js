'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    const pastSpoilage = new Date(now);
    pastSpoilage.setDate(pastSpoilage.getDate() - 5);

    await queryInterface.bulkInsert('InventoryLogs', [
      {
        user_id_fk: 1,
        product_id_fk: 40, // Sosis Ayam Champ
        action: 'spoilage',
        quantity: 10,
        spoilage_loss: 10 * 30000, // 300.000 kerugian basi
        notes: 'Sosis Ayam expired di gudang dan terpaksa dibuang.',
        createdAt: pastSpoilage,
        updatedAt: pastSpoilage
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('InventoryLogs', null, {});
  }
};
