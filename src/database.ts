import { IDataConfiguration } from "./configurations";
import * as fs from 'fs';
import * as path from 'path';
import * as Sequelize from 'sequelize';

// Import model specification from its own definition file.

interface DbConnection {
    User: Sequelize.Model<any, any>
}

Sequelize.Model
export function init(config: IDataConfiguration): any {
    let sequelize = new Sequelize(config.connection.database, config.connection.user, config.connection.password, {
        host: config.connection.host,
        dialect: config.client,
        pool: config.pool,
        define: {
            timestamps: false // true by default
        }
    });

    let db = {};
    const basename = path.basename(module.filename);
    const Modles = config.models;
    Modles.forEach(model => {
        let modelPath = __dirname + '/' + model;
        fs.readdirSync(modelPath)
            .filter(function (file) {
                return (file.indexOf('.') !== 0) && (file !== basename) &&
                    (file.slice(-3) === '.js') && (file.slice(0, -3) === model);
            })
            .forEach(function (file) {
                const model = sequelize['import'](path.join(modelPath, file));
                // NOTE: you have to change from the original property notation to
                // index notation or tsc will complain about undefined property.
                db[model['name']] = model;
            });

        Object.keys(db).forEach(function (modelName) {
            if (db[modelName].associate) {
                db[modelName].associate(db);
            }
        });
    });

    db['sequelize'] = sequelize;
    db['Sequelize'] = Sequelize;

    return db;
}