import { IPlugin, IPluginOptions } from "../interfaces";
import * as Hapi from "hapi";
import * as Sequelize from 'sequelize';
import * as Configs from "../../configurations";

export default (): IPlugin => {
    return {
        register: (server: Hapi.Server, options: IPluginOptions): Promise<Hapi.Server> => {
            return new Promise<void>(resolve => {
                const dbConfigs = Configs.getDatabaseConfig();                
                // const database = options.database;
                const opts = {
                    host: dbConfigs.connection.host,
                    dialect: 'mysql',
                    pool: dbConfigs.connection.pool
                };
                console.log(dbConfigs);
                console.log('---------------------------');
                server.register([{
                    register: require('hapi-sequelize'),
                    options: [
                        {
                            name: 'davinci', // identifier
                            models: ['../users/users.ts'],  // paths/globs to model files
                            sequelize: new Sequelize(dbConfigs.connection.dbConfigs,
                                dbConfigs.connection.user, dbConfigs.connection.password, opts
                            ), // sequelize instance
                            sync: true, // sync models - default false
                            forceSync: false, // force sync (drops tables) - default false
                            // onConnect: function (database) { // Optional
                            //     console.log(database);
                            //     // migrations, seeders, etc.
                            // }
                        }
                    ]
                }], (error) => {
                    if (error) {
                        console.log('error', error);
                    }
                    resolve();
                });
            });
        },
        info: () => {
            return {
                name: "Sequelize",
                version: "1.0.0"
            };
        }
    };
};