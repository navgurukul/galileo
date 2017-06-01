"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Hapi = require("hapi");
const Users = require("./users");
const Courses = require("./courses");
const Assignments = require("./assignments");
const Reports = require("./reports");
function init(configs, database) {
    return new Promise(resolve => {
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
        const plugins = configs.plugins;
        const pluginOptions = {
            database: database,
            serverConfigs: configs
        };
        let pluginPromises = [];
        plugins.forEach((pluginName) => {
            var plugin = (require("./plugins/" + pluginName)).default();
            console.log(`Register Plugin ${plugin.info().name} v${plugin.info().version}`);
            pluginPromises.push(plugin.register(server, pluginOptions));
        });
        // Register all the routes once all plugins have been initialized
        Promise.all(pluginPromises).then(() => {
            Users.init(server, configs, database);
            Courses.init(server, configs, database);
            Assignments.init(server, configs, database);
            Reports.init(server, configs, database);
            resolve(server);
        });
    });
}
exports.init = init;
;
//# sourceMappingURL=server.js.map