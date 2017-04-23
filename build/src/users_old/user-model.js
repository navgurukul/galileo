"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const dbtable_1 = require("../models/dbtable");
const Jwt = require("jsonwebtoken");
class User extends dbtable_1.default {
    constructor() {
        super(index_1.default, "users");
    }
    create(email, name, profilePicture, googleUserId) {
        return this.database('users').insert({ email: email, name: name, profilePicture: profilePicture });
    }
    getByEmail(email) {
        return this.database('users').select().where('email', email);
    }
    generateJwtToken(email, id) {
        return Jwt.sign({ email: email, id: id }, "secret", { expiresIn: "24h" });
    }
    // public submitAssignment(userId: number, assignmentName: string, path: string) {
    //     return this.database('submissions').insert({courseType: 'html', name: assignmentName, userId: userId, filesPath: path});
    // }
    getAssignment(assignmentId) {
        return this.database('assignments').select().where('id', assignmentId);
    }
}
exports.User = User;
//# sourceMappingURL=user-model.js.map