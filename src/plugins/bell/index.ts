import { IPlugin, IPluginOptions } from "../interfaces";
import * as Hapi from "hapi";
import * as bell from "bell";

// import { IUser, UserModel } from "../../users/user";

export default (): IPlugin => {
    return {
        register: (server: Hapi.Server, options: IPluginOptions):Promise<Hapi.Server> => {
            return new Promise<void>(resolve => {
                const database = options.database;
                const serverConfig = options.serverConfigs;

                server.register({
                    register: bell
                }, (error) => {
                        console.log('auth strategy google');
                        server.auth.strategy('google', 'bell', {
                            provider: 'google',
                            password: 'cookie_encryption_password_secure',
                            isSecure: false,
                            clientId: '330505979484-sgfkanh7p0nsqvua8susd9q60i94dnbh.apps.googleusercontent.com',
                            clientSecret: 'x5UGIUszCFBvRTGW41xpA5-g',
                            location: "http://localhost:" + server.info.port + "/bell"
                        });

                    if (error) {
                    } else {
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


