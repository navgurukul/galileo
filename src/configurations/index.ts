// import * as nconf from "nconf";
// import * as path from "path";
// error logging using sentry.

const Sentry = require('@sentry/node');

const configs=require("../constant")


// Read Configurations
// const configs = new nconf.Provider({
//   env: true,
//   argv: true,
//   store: {
//     type: 'file',
//       file: path.join(__dirname, `./config.${process.env.GALILEO_ENV}.json`)
//   }
// });

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
    githubAccess: {
        SCHOOL_ID: string,
        SECRET_KEY: string
    }   
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
    timeInSecond: any;
    minute:any;
    hour:any;
    dayOfMonth:any;
    month:any;
    dayOfWeek:any;
    receiverEmail: string;
}

// export interface CliqConfigurations {
//     authtoken:  string;
// }

export function checkConfigEnvironment(): void {
    if (!!configs["database"] === false) {
        console.error('Check GALILEO_ENV variable');
        process.exit();
    }
}

export function getDatabaseConfig(): IDataConfiguration {
    checkConfigEnvironment();
    //
    return configs["database"];
}

export function getServerConfigs(): IServerConfigurations {
    checkConfigEnvironment();
    return configs["server"];
}

export function getCourseConfigs(): CouseConfigurations {
    checkConfigEnvironment();
    return configs["courseConfig"];
}

export function getScheduleConfigs(): ScheduleConfigurations {
    checkConfigEnvironment();
    return  configs["scheduleConfigs"];
}

export function getSentryConfig(){
    checkConfigEnvironment();
    let sentryConfig = configs["sentryConfig"];
    Sentry.init({ dsn: sentryConfig.sentryDsn });
    return Sentry;
}

// export function getCliqConfig():CliqConfigurations{
//     checkConfigEnvironment()
//     return configs["cliqConfig"]
// }
