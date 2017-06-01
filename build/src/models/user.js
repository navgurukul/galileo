"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import * as Mongoose from "mongoose";
const index_1 = require("../index");
const dbtable_1 = require("./dbtable");
;
class User extends dbtable_1.default {
    constructor() {
        super(index_1.default, "users");
    }
    // table name, reference of db
    getFirstElement() {
        return this.database.select().from('random');
        //return first row 
    }
}
exports.User = User;
// export const User = ; 
//# sourceMappingURL=user.js.map