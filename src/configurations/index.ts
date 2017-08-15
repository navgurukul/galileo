import * as nconf from "nconf";
import * as path from "path";

//Read Configurations
const configs = new nconf.Provider({
    env: true,
    argv: true,
    store: {
        type: 'file',
        file: path.join(__dirname, `./config.${process.env.NODE_ENV || "dev"}.json`)
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
    googleCloud: {
        projectId: string;
        keyFilename: string;
        assignmentsBucket: string;
    };
    facilitatorEmails: Array<string>;
    defaultBatchId: number;
}

export interface IDataConfiguration {
    client: string;
    connection: {
        database: string;
        host: string;
        user: string;
        password: string;
        requestTimeout: number;
        connectionTimeout: number;
        acquireConnectionTimeout: number;
    };
    pool: {
        min: number;
        max: number;
    };
    models: Array<string>;
}

export function getDatabaseConfig(): IDataConfiguration {
    console.log("Node Environment: ", process.env.NODE_ENV);
    return configs.get("database");
}

export function getServerConfigs(): IServerConfigurations {
    return configs.get("server");
}