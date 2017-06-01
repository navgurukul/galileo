"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Server = require("./server");
const Database = require("./database");
const Configs = require("./configurations");
console.log(`Running enviroment ${process.env.NODE_ENV || "dev"}`);
//Init Database
const dbConfigs = Configs.getDatabaseConfig();
const database = Database.init(dbConfigs);
exports.default = database;
//Starting Application Server
const serverConfigs = Configs.getServerConfigs();
const server = Server.init(serverConfigs, database).then((server) => {
    server.start(() => {
        console.log('Server running at:', server.info.uri);
    });
});
//# sourceMappingURL=index.js.map