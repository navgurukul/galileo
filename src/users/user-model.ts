import database from '../index';
import DBTable from '../models/dbtable';
import * as Jwt from "jsonwebtoken";

export class User extends DBTable {

    constructor() {
        super(database, "users");
    }

    public create(email: string, name: string, profilePicture: string, googleUserId: string) {
        return this.database('users').insert({email: email, name: name, profilePicture: profilePicture, googleId: googleUserId});
    }

    public getByEmail(email: string) {
        return this.database('users').select().where('email', email);
    }

    public generateJwtToken(email: string) {
        return Jwt.sign({email: email}, "secret", "24h");
    }

}