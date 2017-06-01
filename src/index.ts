import * as Server from "./server";
import * as Database from "./database";
import * as Configs from "./configurations";

console.log(`Running enviroment ${process.env.NODE_ENV || "dev"}`);

//Init Database
const dbConfigs = Configs.getDatabaseConfig();
const database = Database.init(dbConfigs);
export default database;

//Starting Application Server
const serverConfigs = Configs.getServerConfigs();

const server = Server.init(serverConfigs, database).then((server) => {
    server.start(() => {
        console.log('Server running at:', server.info.uri);
    });
});