import * as Hapi from "hapi";
import Routes from "./routes";
// import { KnexDB } from "../database";
import { IServerConfigurations } from "../configurations";

export function init(server: Hapi.Server, configs: IServerConfigurations, database: any) {
    Routes(server, configs, database);
}