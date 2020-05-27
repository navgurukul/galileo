import { IPlugin, IPluginOptions } from "../interfaces";
import * as Hapi from "hapi";
// import { IUser, UserModel } from "../../users/user";

export default (): IPlugin => {
    return {
        register: (server: Hapi.Server, options: IPluginOptions): Promise<void>  => {
            return new Promise<void>(resolve => {
                const database = options.database;
                const serverConfig = options.serverConfigs;

                server.register(require('hapi-auth-jwt2'))
                .then(() => {
                    //
                    const validateUser = (decoded, request) => {
                        request.user_id = decoded.id;
                        
                        // 
                        // return cb(null, true);
                        return {
                            isValid:true
                        };
                    };
                    
                    server.auth.strategy('jwt', 'jwt', {
                            key: serverConfig.jwtSecret,
                            validate: validateUser,
                            verifyOptions: { algorithms: ['HS256'] }
                        });
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
