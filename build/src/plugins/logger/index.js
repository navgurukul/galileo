"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => {
    return {
        register: (server) => {
            return new Promise(resolve => {
                const opts = {
                    opsInterval: 1000,
                    reporters: [{
                            reporter: require('good-console'),
                            events: { error: '*', log: '*', response: '*', request: '*' }
                        }]
                };
                server.register({
                    register: require('good'),
                    options: opts
                }, (error) => {
                    if (error) {
                        console.log('error', error);
                    }
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