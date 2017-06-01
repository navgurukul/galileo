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
}

export interface IDataConfiguration {
    connectionString: string;
}

export function getDatabaseConfig(): IDataConfiguration {
    console.log(process.env.NODE_ENV);
    return configs.get("database");
}

export function getServerConfigs(): IServerConfigurations {
    return configs.get("server");
}