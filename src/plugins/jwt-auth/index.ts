import { IPlugin, IPluginOptions } from "../interfaces";
import * as Hapi from "hapi";
// import { IUser, UserModel } from "../../users/user";

export default (): IPlugin => {
    return {
        register: (server: Hapi.Server, options: IPluginOptions): Promise<void>  => {
            return new Promise<void>(resolve => {
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
                    } else {
                        server.auth.strategy('jwt', 'jwt', false,
                            {
                                key: serverConfig.jwtSecret,
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