const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mariadb',
        port: process.env.DB_PORT,
        logging: false,
    }
);

// 모델 정의
const User = require('./User')(sequelize);
const Account = require('./Account')(sequelize);
const Transaction = require('./Transaction')(sequelize);
const Shop = require('./Shop')(sequelize);
const OrderTable = require('./OrderTable')(sequelize);

// 관계 설정
User.hasOne(Account, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Account.belongsTo(User, { foreignKey: 'user_id' });

Account.hasMany(Transaction, { foreignKey: 'account_id', onDelete: 'CASCADE' });
Transaction.belongsTo(Account, { foreignKey: 'account_id' });

User.hasMany(OrderTable, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Shop.hasMany(OrderTable, { foreignKey: 'shop_id', onDelete: 'CASCADE' });
Account.hasMany(OrderTable, { foreignKey: 'account_id', onDelete: 'CASCADE' });

module.exports = {
    sequelize,
    User,
    Account,
    Transaction,
    Shop,
    OrderTable,
};
