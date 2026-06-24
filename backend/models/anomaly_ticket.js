module.exports = (sequelize, DataTypes) => {
  const AnomalyTicket = sequelize.define('AnomalyTicket', {
    ticket_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id_fk: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    anomaly_type: {
      type: DataTypes.ENUM('TIME', 'PRICE'),
      allowNull: false
    },
    reference_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('OPEN', 'RESOLVED', 'DISMISSED'),
      defaultValue: 'OPEN',
      allowNull: false
    },
    resolution_note: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    resolved_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    resolved_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'Anomaly_Tickets',
    timestamps: true, // we want createdAt
    // FIX (HIGH-09): Index kritis untuk anomaly detection.
    // checkTimeAnomaly + checkPriceAnomaly memanggil findOne({ reference_id, anomaly_type })
    // pada SETIAP pembuatan transaksi — tanpa index ini = full table scan tiap transaksi.
    indexes: [
      { fields: ['reference_id', 'anomaly_type'] },  // Deduplication check (dipanggil tiap transaksi)
      { fields: ['user_id_fk', 'status'] },          // getAnomalies: filter per toko + status OPEN
      { fields: ['user_id_fk'] }                     // Filter per toko
    ]
  });

  AnomalyTicket.associate = (models) => {
    AnomalyTicket.belongsTo(models.User, { foreignKey: 'user_id_fk' });
    AnomalyTicket.belongsTo(models.User, { foreignKey: 'resolved_by', as: 'Resolver' });
    AnomalyTicket.belongsTo(models.Transaction, { foreignKey: 'reference_id', constraints: false, as: 'TransactionRef' });
    AnomalyTicket.belongsTo(models.TransactionDetail, { foreignKey: 'reference_id', constraints: false, as: 'DetailRef' });
  };

  return AnomalyTicket;
};
