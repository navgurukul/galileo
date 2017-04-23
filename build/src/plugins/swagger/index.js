"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => {
    return {
        register: (server) => {
            return new Promise(resolve => {
                server.register([
                    require('inert'),
                    require('vision'),
                    {
                        register: require('hapi-swagger'),
                        options: {
                            info: {
                                title: 'Galielo - SARAL API',
                                description: 'API powering the the NavGurukul learning platform :)',
                                version: '0.1'
                            },
                            securityDefinitions: {
                                'jwt': {
                                    'type': 'apiKey',
                                    'name': 'Authorization',
                                    'in': 'header'
                                }
                            },
                            tags: [
                                {
                                    'name': 'users',
                                },
                                {
                                    'name': 'courses',
                                },
                                {
                                    'name': 'assignments',
                                },
                                {
                                    'name': 'reports',
                                }
                            ],
                            documentationPage: true,
                            documentationPath: '/docs'
                        }
                    }
                ], (error) => {
                    if (error) {
                        console.log('error', error);
                    }
                    resolve();
                });
            });
        },
        info: () => {
            return {
                name: "Swagger Documentation",
                version: "1.0.0"
            };
        }
    };
};
//# sourceMappingURL=index.js.map