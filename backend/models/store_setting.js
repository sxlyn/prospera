module.exports = (sequelize, DataTypes) => {
  const StoreSettings = sequelize.define('StoreSettings', {
    setting_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id_fk: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true
    },
    open_hour: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: '08:00:00'
    },
    close_hour: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: '22:00:00'
    },
    grace_period_minutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30
    },
    is_overtime_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    emergency_pin: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'StoreSettings',
    timestamps: true
  });

  StoreSettings.associate = (models) => {
    StoreSettings.belongsTo(models.User, { foreignKey: 'user_id_fk' });
  };

  return StoreSettings;
};
