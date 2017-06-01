"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import { IUser, UserModel } from "../../users/user";
exports.default = () => {
    return {
        register: (server, options) => {
            return new Promise(resolve => {
                const database = options.database;
                const serverConfig = options.serverConfigs;
                const validateUser = (decoded, request, cb) => {
                    request.userId = decoded.id;
                    // console.log('this is the id', request.userId);
                    return cb(null, true);
                };
                server.register({
                    register: require('hapi-auth-jwt2')
                }, (error) => {
                    if (error) {
                        console.log('error', error);
                    }
                    else {
                        server.auth.strategy('jwt', 'jwt', false, {
                            key: "secret",
                            validateFunc: validateUser,
                            verifyOptions: { algorithms: ['HS256'] }
                        });
                    }
                    resolve();
                });
            });
        },
        info: () => {
            return {
                name: "JWT Authentication",
                version: "1.0.0"
            };
        }
    };
};
//# sourceMappingURL=index.js.map