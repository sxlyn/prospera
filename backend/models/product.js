module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    product_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id_fk: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    product_name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    product_cost: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    product_price: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    product_stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'Products',
    timestamps: true,
    paranoid: true // Mengaktifkan soft delete (deletedAt)
  });

  Product.associate = (models) => {
    Product.hasMany(models.TransactionDetail, { foreignKey: 'product_id_fk' });
  };

  return Product;
};