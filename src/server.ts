import * as Hapi from "hapi";
import { IPlugin } from "./plugins/interfaces";
import { IServerConfigurations } from "./configurations";

import * as Users from "./users";
import * as Courses from "./courses";
import * as Assignments from "./assignments";


export function init(configs: IServerConfigurations, database: any): Promise<Hapi.Server> {
    return new Promise<Hapi.Server>(resolve => {
        const port = process.env.port || configs.port;
        const server = new Hapi.Server();

        server.connection({
            port: port,
            routes: {
                 cors: {
                    "headers": ["Accept", "Authorization", "Content-Type", "If-None-Match", "Accept-language"]
                 },
                 log: true
            }
        });
        // server.ext('onPreResponse', corsHeaders);

        //  Setup Hapi Plugins
        const plugins: Array<string> = configs.plugins;
        const pluginOptions = {
            database: database,
            serverConfigs: configs
        };

        let pluginPromises = [];

        plugins.forEach((pluginName: string) => {
            var plugin: IPlugin = (require("./plugins/" + pluginName)).default();
            console.log(`Register Plugin ${plugin.info().name} v${plugin.info().version}`);
            pluginPromises.push(plugin.register(server, pluginOptions));
        });

        // Register all the routes once all plugins have been initialized
        Promise.all(pluginPromises).then(() => {
            Users.init(server,  configs, database);
            Courses.init(server, configs, database);
            Assignments.init(server, configs, database);
            resolve(server);
        });

    });
};