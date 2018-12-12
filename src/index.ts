import * as Server from "./server";
import * as Database from "./database";
import * as Configs from "./configurations";

// error logging using sentry.
const Sentry = require('@sentry/node');
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

const serverConfigs = Configs.getServerConfigs();

//Starting Application Server
const server = Server.init(serverConfigs, databaseConfig)
    .then((server) => {
        if (!module.parent) {
          // console.log("yahan"); 
            server.start(() => {
                console.log('Server running at:', server.info.uri);
            });
            // Sentry.init({ dsn: 'https://a1a49265285241f781446519bf331848@sentry.io/1331317' });
            console.log("Running server from parent :)");
        } else {
            console.log("Not running the `server because it is not run through parent module.");
        }
    });
