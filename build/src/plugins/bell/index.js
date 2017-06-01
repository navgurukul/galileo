"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bell = require("bell");
// import { IUser, UserModel } from "../../users/user";
exports.default = () => {
    return {
        register: (server, options) => {
            return new Promise(resolve => {
                const database = options.database;
                const serverConfig = options.serverConfigs;
                server.register({
                    register: bell
                }, (error) => {
                    if (error) {
                    }
                    else {
                        server.auth.strategy('google', 'bell', {
                            provider: 'google',
                            password: 'cookie_encryption_password_secure',
                            isSecure: false,
                            clientId: '330505979484-sgfkanh7p0nsqvua8susd9q60i94dnbh.apps.googleusercontent.com',
                            clientSecret: 'x5UGIUszCFBvRTGW41xpA5-g',
                            location: "http://localhost:" + server.info.port + "/bell"
                        });
                    }
                    resolve();
                });
            });
        },
        info: () => {
            return {
                name: "Bell",
                version: "1.0.0"
            };
        }
    };
};
//# sourceMappingURL=index.js.map