module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    transaction_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id_fk: {
      type: DataTypes.INTEGER
    },
    total_amount: {
      type: DataTypes.INTEGER, 
      defaultValue: 0
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

  return Transaction;
};