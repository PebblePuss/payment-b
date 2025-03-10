const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('OrderTable', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        shop_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        account_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 1 },
        },
        total_price: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        order_date: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    }, { timestamps: false });
};
