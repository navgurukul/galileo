import database from '../index';
import DBTable from '../models/dbtable';
import * as Jwt from "jsonwebtoken";

export class User extends DBTable {

    constructor() {
        super(database, "users");
    }

    public create(email: string, name: string, profilePicture: string, googleUserId: string) {
        return this.database('users').insert({email: email, name: name, profilePicture: profilePicture});
    }

    public getByEmail(email: string) {
        return this.database('users').select().where('email', email);
    }

    public generateJwtToken(email: string, id: number) {
        return Jwt.sign({email: email, id: id}, "secret", {expiresIn: "24h"});
    }

    // public submitAssignment(userId: number, assignmentName: string, path: string) {
    //     return this.database('submissions').insert({courseType: 'html', name: assignmentName, userId: userId, filesPath: path});
    // }

    public getAssignments( courseType: string) {
        return this.database('assignments').select().orderBy('sequenceNo', 'asc').where('course', courseType);
    }

}