//ignore this
// import * as Mongoose from "mongoose";
import database from '../index';
import DBTable from './dbtable';
import * as Jwt from "jsonwebtoken";
import {IServerConfigurations} from "../configurations/index";
import { userInfo } from 'os';

export interface IUser {
    name: string;
    email: string;
    password: string;
    created_at: Date;
    updateAt: Date;

    validatePassword(requestPassword): boolean;
}

export class UserModel extends DBTable {
    configs: any;

    constructor(configs: IServerConfigurations) {
        super(database, "users");
        this.configs = configs;
    }

    public getJWTToken(user) {
        let token = Jwt.sign(
            {email: user.email, id: user.id,isAdmin:user.isAdmin,isFacilitator:user.isFacilitator,isAlumni: user.isAlumni},
            this.configs.jwtSecret,
            {expiresIn: this.configs.jwtExpiration}
        );
        // console.log(token);
        return token;
        
    }
}

