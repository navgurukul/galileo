//import * as Mongoose from "mongoose";
// import * as Mysql from 'mysql';
import { IDataConfiguration } from "./configurations";
import * as Sequelize from 'sequelize';
// import { IUser, UserModel } from "./users/user";
// import { ITask, TaskModel } from "./tasks/task";

// export interface KnexDB {
//     userModel: Mongoose.Model<IUser>;
//     taskModel: Mongoose.Model<ITask>;
// }

// export interface KnexDB {
//     db: any;
// }

export function init(config: IDataConfiguration): any {
    let sequelize = new Sequelize(config.connection.database, config.connection.user, config.connection.password, {
        host: config.connection.host,
        dialect: config.client,
        pool: config.pool
    });

    return sequelize.authenticate().then(() => {
        console.log("connection established with database");
        return Promise.resolve(sequelize);
    }).catch((err) => {
        console.log("connection failed", err);
    });
}