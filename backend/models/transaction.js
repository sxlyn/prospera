module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    transaction_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id_fk: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    cashier_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    total_amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    transaction_type: {
      type: DataTypes.ENUM('buy', 'sell'),
      defaultValue: 'sell',
      allowNull: false
    },
    transaction_datetime: {
      type: DataTypes.DATE, 
      defaultValue: DataTypes.NOW
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.ENUM('pending', 'success', 'cancelled'),
      defaultValue: 'success',
      allowNull: false
    }
  }, {
    tableName: 'Transactions',
    timestamps: false
  });

  Transaction.associate = (models) => {
    Transaction.hasMany(models.TransactionDetail, { foreignKey: 'transaction_id_fk' });
    Transaction.belongsTo(models.User, { foreignKey: 'user_id_fk' });
    Transaction.belongsTo(models.User, { foreignKey: 'cashier_id', as: 'Cashier' });
  };

  return Transaction;
};