import { IPlugin } from "../interfaces";
import * as Hapi from "hapi";

export default (): IPlugin => {
    return {
        register: (server: Hapi.Server): Promise<Hapi.Server> => {
            return new Promise<void>(resolve => {
                const opts = {
                    ops:{
                        interval:1000,
                    },
                    reporters: {
                        myConsoleReporter: [
                            {
                                module: 'good-squeeze',
                                name: 'Squeeze',
                                args: [{ log: '*', response: '*' }]
                            }, 
                            {
                                module: 'good-console'
                            }, 
                            'stdout'
                        ],
                    }
                };

                server.register({
                    plugin: require('good'),
                    options: opts
                })
                .then(() => {
                //   console.log("hello")
                  resolve();
                });
            });
        },
        info: () => {
            return {
                name: "Good Logger",
                version: "1.0.0"
            };
        }
    };
};
