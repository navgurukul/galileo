"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
const Hapi = require("hapi");
const Assignments = require("./controllers/assignments");
const Courses = require("./controllers/courses");
const Reports = require("./controllers/reports");
const Users = require("./controllers/users");
function init(serverConfigs, databaseConfig) {
    return new Promise(resolve => {
        const port = process.env.port || serverConfigs.port;
        const server = new Hapi.Server({
            port: port,
            routes: {
                cors: {
                    'headers': ['Accept', 'Authorization', 'Content-Type', 'If-None-Match', 'Accept-language']
                },
            }
        });
        // server.connection();
        // server.ext('onPreResponse', corsHeaders);
        //  Setup Hapi Plugins
        const plugins = serverConfigs.plugins;
        const pluginOptions = {
            database: databaseConfig,
            serverConfigs: serverConfigs
        };
        let pluginPromises = [];
        plugins.forEach((pluginName) => {
            let plugin = (require('./plugins/' + pluginName)).default();
            console.log(`Register Plugin ${plugin.info().name} v${plugin.info().version}`);
            // sentry should only be used in production.
            if (plugin.info().name === 'Sentry logging') {
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
exports.init = init;
//# sourceMappingURL=server.js.map