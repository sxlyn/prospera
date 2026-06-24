'use strict';
module.exports = (sequelize, DataTypes) => {
  const InventoryLog = sequelize.define('InventoryLog', {
    user_id_fk:     { type: DataTypes.INTEGER,    allowNull: false },
    product_id_fk:  { type: DataTypes.INTEGER,    allowNull: true },
    action:         { type: DataTypes.STRING(50),  allowNull: false },
    quantity:       { type: DataTypes.INTEGER,    allowNull: true },
    spoilage_loss:  { type: DataTypes.BIGINT,     allowNull: true },
    notes:          { type: DataTypes.TEXT,       allowNull: true }
  }, {
    tableName: 'InventoryLogs',
    timestamps: true,  // createdAt dipakai untuk filter tanggal pemusnahan
    // FIX (HIGH-09 + SPOILAGE-01): Indexes pada kolom yang paling sering diquery
    indexes: [
      { fields: ['user_id_fk', 'action'] },  // getSpoilageLoss: filter per toko + jenis aksi
      { fields: ['product_id_fk'] },          // JOIN ke Product untuk product_name
      { fields: ['createdAt'] }               // Filter tanggal pemusnahan
    ]
  });

  // FIX (SPOILAGE-01): Asosiasi ke Product agar getSpoilageLoss bisa eager-load product_name
  InventoryLog.associate = (models) => {
    InventoryLog.belongsTo(models.Product, { 
      foreignKey: 'product_id_fk',
      as: 'Product',
      constraints: false,  // Product bisa saja sudah soft-deleted
      paranoid: false
    });
  };

  return InventoryLog;
};