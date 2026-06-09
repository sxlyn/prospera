module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Username tidak boleh kosong.' },
        len: { args: [1, 100], msg: 'Username maksimal 100 karakter.' }
      }
    },
    email: {
      type: DataTypes.STRING(100), 
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: 'Format email tidak valid.' },
        notEmpty: { msg: 'Email tidak boleh kosong.' }
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Password tidak boleh kosong.' },
        len: { args: [6, 255], msg: 'Password minimal 6 karakter.' }
      }
    },
    role: {
      type: DataTypes.ENUM('owner', 'karyawan'),
      allowNull: false,
      defaultValue: 'owner',
      validate: {
        isIn: {
          args: [['owner', 'karyawan']],
          msg: 'Role harus berupa "owner" atau "karyawan".'
        }
      }
    },
    owner_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'user_id'
      }
    }
  }, {
    tableName: 'Users',
    timestamps: false
  });

  User.associate = (models) => {
    // Owner memiliki banyak Karyawan
    User.hasMany(models.User, {
      foreignKey: 'owner_id',
      as: 'Karyawans'
    });
    // Karyawan dimiliki oleh satu Owner
    User.belongsTo(models.User, {
      foreignKey: 'owner_id',
      as: 'Owner'
    });
  };

  return User;
};