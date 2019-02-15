import * as nconf from "nconf";
import * as path from "path";

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


export function checkConfigEnvironment(): void {
    if (!!configs.get("database") === false) {
        console.error('Check GALILEO_ENV variable');
        process.exit();
    }
}

export function getDatabaseConfig(): IDataConfiguration {
    checkConfigEnvironment();
    //console.log("Node Environment: ", process.env.NODE_ENV);
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
