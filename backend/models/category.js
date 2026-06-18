module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define('Category', {
    category_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id_fk: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    category_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    requires_expired_date: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'Categories',
    timestamps: true
  });

  Category.associate = (models) => {
    // 1 Kategori dimiliki oleh 1 User
    Category.belongsTo(models.User, { foreignKey: 'user_id_fk' });
    
    // 1 Kategori memiliki banyak Product
    Category.hasMany(models.Product, { foreignKey: 'category_id_fk' });
  };

  return Category;
};