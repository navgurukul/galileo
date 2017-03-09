import * as Hapi from "hapi";
// import { KnexDB } from "../database";
import { IServerConfigurations } from "../configurations";


export interface IPluginOptions {
    database: any;
    serverConfigs: IServerConfigurations;
}

export interface IPlugin {
    register(server: Hapi.Server, options?: IPluginOptions): Promise<void>;
    info(): IPluginInfo;
}

export interface IPluginInfo {
    name: string;
    version: string;
}