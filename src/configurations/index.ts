import * as nconf from "nconf";
import * as path from "path";

// error logging using sentry.
const Sentry = require('@sentry/node');


//Read Configurations
const configs = new nconf.Provider({
  env: true,
  argv: true,
  store: {
    type: 'file',
      file: path.join(__dirname, `./config.${process.env.GALILEO_ENV}.json`)
  }
});

export interface IServerConfigurations {
    port: number;
    plugins: Array<string>;
    jwtSecret: string;
    jwtExpiration: string;
    googleAuth: {
        clientId: string;
        clientSecret: string;
    };
    awsEmailConfig:{
      accessKeyId: string;
      secretAccessKey: string;
    };
    facilitatorEmails: Array<string>;
    defaultBatchId: number;
}

export interface IDataConfiguration {
    connectionString: string;
    connection: {
        typeCast: object;
    };
}

export interface CouseConfigurations {
    courseCompleteionCriteria: number;
}

export interface ScheduleConfigurations {
    timeInSecond: number;
    receiverEmail: string;
}

export interface CliqConfigurations {
    authtoken:  string;
}

export function checkConfigEnvironment(): void {
    if (!!configs.get("database") === false) {
        console.error('Check GALILEO_ENV variable');
        process.exit();
    }
}

export function getDatabaseConfig(): IDataConfiguration {
    checkConfigEnvironment();
    //
    return configs.get("database");
}

export function getServerConfigs(): IServerConfigurations {
    checkConfigEnvironment();
    return configs.get("server");
}

export function getCourseConfigs(): CouseConfigurations {
    checkConfigEnvironment();
    return configs.get("courseConfig");
}

export function getScheduleConfigs(): ScheduleConfigurations {
    checkConfigEnvironment();
    return  configs.get("scheduleConfig");  
}

export function getSentryConfig(){
    checkConfigEnvironment();
    let sentryConfig = configs.get("sentryConfig");
    Sentry.init({ dsn: sentryConfig.sentryDsn });
    return Sentry;
}

export function getCliqConfig():CliqConfigurations{
    checkConfigEnvironment()
    return configs.get("cliqConfig");
}