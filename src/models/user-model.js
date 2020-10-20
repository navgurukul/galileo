"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
//ignore this
// import * as Mongoose from "mongoose";
const index_1 = require("../index");
const dbtable_1 = require("./dbtable");
const Jwt = require("jsonwebtoken");
class UserModel extends dbtable_1.default {
    constructor(configs) {
        super(index_1.default, "users");
        this.configs = configs;
    }
    getJWTToken(user) {
        let token = Jwt.sign({ email: user.email, id: user.id, isAdmin: user.isAdmin, isFacilitator: user.isFacilitator, isAlumni: user.isAlumni }, this.configs.jwtSecret, { expiresIn: this.configs.jwtExpiration });
        return token;
    }
}
exports.UserModel = UserModel;
//# sourceMappingURL=user-model.js.map