"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import { IUser, UserModel } from "./users/user";
// import { ITask, TaskModel } from "./tasks/task";
// export interface KnexDB {
//     userModel: Mongoose.Model<IUser>;
//     taskModel: Mongoose.Model<ITask>;
// }
// export interface KnexDB {
//     db: any;
// }
function init(config) {
    let database = require('knex')(config);
    return database;
}
exports.init = init;
//# sourceMappingURL=database.js.map