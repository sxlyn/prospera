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
      type: DataTypes.BIGINT,
      allowNull: false
    },
    selling_price: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    transaction_type: {
      type: DataTypes.ENUM('buy', 'sell'),
      defaultValue: 'sell',
      allowNull: false
    },
    sub_total: {
      type: DataTypes.BIGINT,
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

  const checkPriceAnomaly = async (detail, options) => {
    const { Transaction, AnomalyTicket } = sequelize.models;
    const trx = await Transaction.findByPk(detail.transaction_id_fk);
    if (!trx) return;

    if (detail.transaction_type === 'sell' && detail.capital_cost > 0) {
        const margin = detail.selling_price - detail.capital_cost;
        const marginPercentage = (margin / detail.capital_cost) * 100;
        
        if (marginPercentage <= 2) {
            const existing = await AnomalyTicket.findOne({
                where: { reference_id: detail.detail_id, anomaly_type: 'PRICE' }
            });
            if (!existing) {
                await AnomalyTicket.create({
                    user_id_fk: trx.user_id_fk,
                    anomaly_type: 'PRICE',
                    reference_id: detail.detail_id,
                    description: `Margin sangat tipis atau jual rugi (${marginPercentage.toFixed(2)}%)`,
                    status: 'OPEN'
                }, { transaction: options.transaction });
            }
        } else {
            await AnomalyTicket.update({ status: 'RESOLVED', resolution_note: 'Sistem: Harga telah diperbaiki menjadi wajar.' }, {
                where: { reference_id: detail.detail_id, anomaly_type: 'PRICE', status: 'OPEN' },
                transaction: options.transaction
            });
        }
    }
  };

  TransactionDetail.addHook('afterCreate', async (detail, options) => {
    const { syncProductAI } = require('../services/aiRestockService');
    syncProductAI(detail.product_id_fk);
    await checkPriceAnomaly(detail, options);
  });

  TransactionDetail.addHook('afterUpdate', async (detail, options) => {
    if (detail.changed('quantity') || detail.changed('transaction_type')) {
        const { syncProductAI } = require('../services/aiRestockService');
        syncProductAI(detail.product_id_fk);
    }
    await checkPriceAnomaly(detail, options);
  });

  TransactionDetail.addHook('afterDestroy', async (detail, options) => {
      const { AnomalyTicket } = sequelize.models;
      await AnomalyTicket.update({ status: 'DISMISSED', resolution_note: 'Sistem: Detail Transaksi telah di-Void/Dihapus' }, {
          where: { reference_id: detail.detail_id, anomaly_type: 'PRICE', status: 'OPEN' },
          transaction: options.transaction
      });
  });

  return TransactionDetail;
};