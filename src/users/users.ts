import * as Sequelize from 'sequelize';

export function defineModel(sequelize) {
    const user = sequelize.define('try', {
        id: { type: Sequelize.STRING, primaryKey: true },

        // instantiating will automatically set the flag to true if not set
        // flag: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },

        // // default values for dates => current time
        // myDate: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },

        // setting allowNull to false will add NOT NULL to the column, which means an error will be
        // thrown from the DB when the query is executed if the column is null. If you want to check that a value
        // is not null before querying the DB, look at the validations section below.
        title: { type: Sequelize.STRING, allowNull: false },

        // Creating two objects with the same value will throw an error. The unique property can be either a
        // boolean, or a string. If you provide the same string for multiple columns, they will form a
        // composite unique key.
        // uniqueOne: { type: Sequelize.STRING, unique: 'compositeIndex' },
        // uniqueTwo: { type: Sequelize.INTEGER, unique: 'compositeIndex' }
    });

    return user.sync({ force: false }).then(() => {
        // Table created
        return Promise.resolve(user);
    });
}