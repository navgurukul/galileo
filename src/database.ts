//import * as Mongoose from "mongoose";
// import * as Mysql from 'mysql';
import { IDataConfiguration } from "./configurations";
import { IUser, UserModel } from "./users/user";
import { ITask, TaskModel } from "./tasks/task";

// export interface KnexDB {
//     userModel: Mongoose.Model<IUser>;
//     taskModel: Mongoose.Model<ITask>;
// }

export interface KnexDB {
    db: any;
}

export function init(config: IDataConfiguration): KnexDB {

    var db = require('knex')(config.connectionString);
    // console.log("NEW CODE");
    // db.select().from('random').then(rows => console.log(rows));

    // (<any>Mongoose).Promise = Promise;
    // Mongoose.connect(config.connectionString);

    // let mongoDb = Mongoose.connection;

    // mongoDb.on('error', () => {
    //     console.log(`Unable to connect to database: ${config.connectionString}`);
    // });

    // mongoDb.once('open', () => {
    //     console.log(`Connected to database: ${config.connectionString}`);
    // });

    return db;
}