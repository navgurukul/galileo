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

const serverConfigs = Configs.getServerConfigs();

const Sentry = Configs.getSentryConfig();

//Starting Application Server
const server = Server.init(serverConfigs, databaseConfig)
    .then((server) => {
        

        if (!module.parent) {
            // console.log("yahan"); 
            server.start(() => {
                console.log('Server running at:', server.info.uri);
            });

            
            server.events.on('request', (request, event, tags) => {
                
                
                if (tags.error) {
                    console.log(event.error);

                    // Sentry.captureMessage('Something went wrong');
                    // Sentry.captureMessage(`${event.error ? event.error.message : 'unknown'}`);
                    // console.log(`koushik Request ${event.request} error: ${event.error ? event.error.message : 'unknown'}`);
                    // console.log( event );
                    if(event.error.stack!=undefined){
                    let stack = event.error.stack;
                    var subStr = stack.match("\n(.*)\n");
                    }else{
                        subStr[0]='unknown';
                    }
                    let additionalData = {
                        url: request.url.path,
                        logedinId:request.userId,
                        requestType:request.method,
                        requestParam:request.params,
                        requestQuery:request.query,
                        requestPayload:request.payload,
                        time: new Date(event.timestamp),
                        line: subStr[0],
                        errorPayload: event.error.output.payload,
                        message: event.error ? event.error.message : 'unknown',
                        enviroment:process.env.GALILEO_ENV
                    };
                    //Sentry.captureException(event.error, { extra: { detailName: 'Detail value' } });

                    // let level = 'info';

                    Sentry.withScope(scope => {
                        Object.keys(additionalData).forEach((key) => {
                            scope.setExtra(key, additionalData[key]);
                        });
                        // scope.setLevel(level);
                        Sentry.captureMessage(event.error ? event.error.message : 'unknown');
                    });
                    
                }
            });



            console.log("Running server from parent :)");
        } else {
            console.log("Not running the `server because it is not run through parent module.");
        }
    });
