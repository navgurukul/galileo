const Hapi  = require('hapi');
import { IServerConfigurations } from './configurations';
import * as Assignments from './controllers/assignments';
import * as Courses from './controllers/courses';
import * as Reports from './controllers/reports';

import * as Users from './controllers/users';
import { IPlugin } from './plugins/interfaces';

export function init(serverConfigs: IServerConfigurations, databaseConfig: any): Promise<Hapi.Server> {
    return new Promise<Hapi.Server>(resolve => {
        const port = process.env.port || serverConfigs.port;
        const server = new Hapi.Server({
            port: port,
            routes: {
                cors: {
                    'headers': ['Accept', 'Authorization', 'Content-Type', 'If-None-Match', 'Accept-language']
                },
                // log: true
            }
        });

        // server.connection();
        // server.ext('onPreResponse', corsHeaders);

        //  Setup Hapi Plugins
        const plugins: Array<string> = serverConfigs.plugins;
        const pluginOptions = {
            database: databaseConfig,
            serverConfigs: serverConfigs
        };

        let pluginPromises = [];

        plugins.forEach((pluginName: string) => {
            let plugin: IPlugin = (require('./plugins/' + pluginName)).default();
            console.log(`Register Plugin ${plugin.info().name} v${plugin.info().version}`);
            // sentry should only be used in production.
            if (plugin.info().name === 'Sentry logging'){
                return;
            }
            pluginPromises.push(plugin.register(server, pluginOptions));
        });
        // Register all the routes once all plugins have been initialized
        //
        Promise.all(pluginPromises).then(() => {
            Users.init(server, serverConfigs, databaseConfig);
            Courses.init(server, serverConfigs, databaseConfig);
            Assignments.init(server, serverConfigs, databaseConfig);
            Reports.init(server, serverConfigs, databaseConfig);
            resolve(server);
        });
    });
}
