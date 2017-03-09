import { IPlugin, IPluginOptions } from "../interfaces";
import * as Hapi from "hapi";
import * as bell from "bell";

// import { IUser, UserModel } from "../../users/user";

export default (): IPlugin => {
    return {
        register: (server: Hapi.Server, options: IPluginOptions) => {
            const database = options.database;
            const serverConfig = options.serverConfigs;

            server.register({
                register: bell
            }, (error) => {
                if (error) {
                } else {
                    server.auth.strategy('google', 'bell', {
                        provider: 'google',
                        password: 'cookie_encryption_password_secure',
                        isSecure: false,
                        clientId: '330505979484-sgfkanh7p0nsqvua8susd9q60i94dnbh.apps.googleusercontent.com',
                        clientSecret: 'x5UGIUszCFBvRTGW41xpA5-g',
                        location: server.info.uri
                    });
                }
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


