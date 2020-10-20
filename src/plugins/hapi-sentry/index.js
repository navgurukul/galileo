"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hapiSentry = require('hapi-sentry');
exports.default = () => {
    return {
        register: (server) => {
            return new Promise(resolve => {
                const opts = {
                    baseUri: server.info.uri,
                    trackUser: true,
                    client: {
                        dsn: 'https://a1a49265285241f781446519bf331848@sentry.io/1331317',
                        environment: process.env.GALILEO_ENV
                    }
                };
                server.register({
                    plugin: hapiSentry,
                    options: opts
                })
                    .then(() => {
                    resolve();
                });
            });
        },
        info: () => {
            return {
                name: "Sentry logging",
                version: "1.0.0"
            };
        }
    };
};
//# sourceMappingURL=index.js.map