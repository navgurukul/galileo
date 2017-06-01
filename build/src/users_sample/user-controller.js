"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Boom = require("boom");
const models_1 = require("../models");
class UserController {
    constructor(configs, database) {
        this.database = database;
        this.configs = configs;
        this.user = new models_1.User();
    }
    generateToken(user) {
        //     const jwtSecret = this.configs.jwtSecret;
        //     const jwtExpiration = this.configs.jwtExpiration;
        // return Jwt.sign({ id: user._id }, jwtSecret, { expiresIn: jwtExpiration });
    }
    loginUser(request, reply) {
        //     const email = request.payload.email;
        //     const password = request.payload.password;
        // User.findOne({ email: email })
        //     .then((user: IUser) => {
        //         if (!user) {
        //             return reply(Boom.unauthorized("User does not exists."));
        //         }
        //         if (!user.validatePassword(password)) {
        //             return reply(Boom.unauthorized("Password is invalid."));
        //         }
        //         const token = this.generateToken(user);
        //         reply({
        //             token: token
        //         });
        //     })
        //     .catch((error) => {
        //         reply(Boom.badImplementation(error));
        //     });
    }
    createUser(request, reply) {
        //     const user: IUser = request.payload;
        //     // this.database.userModel.create(user).then((user) => {
        //     //     const token = this.generateToken(user);
        //     //     reply({ token: token }).code(201);
        //     // })
        //     //     .catch((error) => {
        //     //         reply(Boom.badImplementation(error));
        //     //     });
    }
    updateUser(request, reply) {
        //     const id = request.auth.credentials.id;
        //     const user: IUser = request.payload;
        //     // this.database.userModel.findByIdAndUpdate(id, { $set: user }, { new: true })
        //     //     .then((user) => {
        //     //         reply(user);
        //     //     })
        //     //     .catch((error) => {
        //     //         reply(Boom.badImplementation(error));
        //     //     });
    }
    deleteUser(request, reply) {
        //     const id = request.auth.credentials.id;
        //     // this.database.userModel.findByIdAndRemove(id)
        //     //     .then((user: IUser) => {
        //     //         reply(user);
        //     //     })
        //     //     .catch((error) => {
        //     //         reply(Boom.badImplementation(error));
        //     //     });
    }
    infoUser(request, reply) {
        this.user.getFirstElement().then(rows => {
            reply(rows);
        })
            .catch(error => {
            reply(Boom.badImplementation(error));
        });
        //     const id = request.auth.credentials.id;
        //     // this.database.userModel.findById(id)
        //     //     .then((user: IUser) => {
        //     //         reply(user);
        //     //     })
        //     //     .catch((error) => {
        //     //         reply(Boom.badImplementation(error));
        //     //     });
    }
}
exports.default = UserController;
//# sourceMappingURL=user-controller.js.map