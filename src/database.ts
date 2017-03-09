//import * as Mongoose from "mongoose";
// import * as Mysql from 'mysql';
import { IDataConfiguration } from "./configurations";
import { IUser, UserModel } from "./users/user";
import { ITask, TaskModel } from "./tasks/task";

// export interface KnexDB {
//     userModel: Mongoose.Model<IUser>;
//     taskModel: Mongoose.Model<ITask>;
// }

// export interface KnexDB {
//     db: any;
// }

export function init(config: IDataConfiguration): any {
    var database: any = require('knex')(config.connectionString);
    return database;
}