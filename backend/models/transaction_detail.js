module.exports = (sequelize, DataTypes) => {
  const TransactionDetail = sequelize.define('TransactionDetail', {
    detail_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    transaction_id_fk: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    product_id_fk: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    capital_cost: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    selling_price: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    transaction_type: {
      type: DataTypes.ENUM('buy', 'sell'),
      defaultValue: 'sell',
      allowNull: false
    },
    sub_total: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'Transaction_details',
    timestamps: false
  });

  TransactionDetail.associate = (models) => {
    TransactionDetail.belongsTo(models.Product, { foreignKey: 'product_id_fk' });
    TransactionDetail.belongsTo(models.Transaction, { foreignKey: 'transaction_id_fk' });
  };

  return TransactionDetail;
};