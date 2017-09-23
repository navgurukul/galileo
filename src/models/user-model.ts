//ignore this
// import * as Mongoose from "mongoose";
import database from '../index';
import DBTable from './dbtable';
import * as Jwt from "jsonwebtoken";
import {IServerConfigurations} from "../configurations/index";

export interface IUser {
    name: string;
    email: string;
    password: string;
    createdAt: Date;
    updateAt: Date;

    validatePassword(requestPassword): boolean;
}

export class UserModel extends DBTable {
    configs: any;

    constructor(configs: IServerConfigurations) {
        super(database, "users");
        console.log(configs);
        this.configs = configs;
    }

    public getJWTToken(user) {
        let token = Jwt.sign(
            {email: user.email, id: user.id},
            this.configs.jwtSecret,
            {expiresIn: this.configs.jwtExpiration}
        );
        return token;
    }
}