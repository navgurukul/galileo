import {IPlugin, IPluginInfo} from "../interfaces";
import * as Hapi from "hapi";

export default (): IPlugin => {
    return {
        register: (server: Hapi.Server): Promise<Hapi.Server> => {
            return new Promise<void>(resolve => {
                server.register([
                    require('inert'),
                    require('vision'),
                    {
                        register: require('hapi-swagger'),
                        options: {
                            info: {
                                title: 'Task Api',
                                description: 'Task Api Documentation',
                                version: '1.0'
                            },
                            tags: [
                                {
                                    'name': 'tasks',
                                    'description': 'Api tasks interface.'
                                },
                                {
                                    'name': 'users',
                                    'description': 'Api users interface.'
                                }
                            ],
                            enableDocumentation: true,
                            documentationPath: '/docs'
                        }
                    }
                ]
                    , (error) => {
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