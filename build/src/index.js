"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Server = require("./server");
const Database = require("./database");
const Configs = require("./configurations");
console.log(`Running enviroment ${process.env.NODE_ENV || "dev"}`);
//Init Database
const dbConfigs = Configs.getDatabaseConfig();
// This will type cast a TINYINT type into a boolean if it is not `null` or just return `null` in case it is null
dbConfigs.connection.typeCast = (field, next) => {
    if (field.type === 'TINY' && field.length === 1) {
        let value = field.string();
        return value ? (value === '1') : null;
    }
    return next();
};
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