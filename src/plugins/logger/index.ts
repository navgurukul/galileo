import { IPlugin } from "../interfaces";
import * as Hapi from "hapi";

export default (): IPlugin => {
    return {
        register: (server: Hapi.Server): Promise<Hapi.Server> => {
            return new Promise<void>(resolve => {
                const opts = {
                    opsInterval: 1000,
                    reporters: [{
                        reporter: require('good-console'),
                        events: { error: '*', log: '*', response: '*', request: '*' }
                    }]
                };

                server.register({
                    plugin: require('good'),
                    options: opts
                })
                .then(() => {
                  // console.log("hello")
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
