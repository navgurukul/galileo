"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => {
    return {
        register: (server) => {
            return new Promise(resolve => {
                const opts = {
                    ops: {
                        interval: 1000,
                    },
                    reporters: {
                        console: [
                            {
                                module: 'good-squeeze',
                                name: 'Squeeze',
                                args: [{ log: '*', response: '*', error: '*' }]
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
                    //   
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
//# sourceMappingURL=index.js.map