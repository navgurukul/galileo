//ignore this

// import * as Mongoose from "mongoose";
import database from '../index';
import DBTable from './dbtable';
import * as Bcrypt from "bcryptjs";

export interface IUser {
    name: string;
    email: string;
    password: string;
    createdAt: Date;
    updateAt: Date;

    validatePassword(requestPassword): boolean;
}

export class UserModel extends DBTable {
    constructor() {
        super(database, "users");
    }
}