import * as Server from "./server";
import * as Database from "./database";
import * as Configs from "./configurations";

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
const databaseConfig = Database.init(dbConfigs);
export default databaseConfig;

//Starting Application Server
const serverConfigs = Configs.getServerConfigs();

const server = Server.init(serverConfigs, databaseConfig).then((server) => {

    if (!module.parent) {
        server.start(() => {
            console.log('Server running at:', server.info.uri);
        });
        console.log("Running server from parent :)");
    } else {
        console.log("Not running the server because it is not run through parent module.");
    }

});