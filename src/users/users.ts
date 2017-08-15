import * as Sequelize from 'sequelize';

export default function (sequelize: Sequelize.Sequelize, DataTypes) {
    const User = sequelize.define('user', {
        id: {
            type: Sequelize.INTEGER(11),
            primaryKey: true,
            autoIncrement: true
        },
        email: {
            type: Sequelize.STRING(50),
            allowNull: false,
            defaultValue: ''
        },
        name: {
            type: Sequelize.STRING(150),
            allowNull: false,
            defaultValue: ''
        },
        profilePicture: {
            type: Sequelize.STRING(150),
            defaultValue: null
        },
        googleUserId: {
            type: Sequelize.STRING(30),
            defaultValue: null
        },
        facilitator: {
            type: Sequelize.INTEGER(1).ZEROFILL
        }
    }, {
            classMethods: {
                associate: function (models) { }
            }
        });
    return User;
}