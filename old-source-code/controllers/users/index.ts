import * as Hapi from "hapi";
import Routes from "./user-routes";
import {IServerConfigurations} from "../../configurations";

export function init(server: Hapi.Server, configs: IServerConfigurations, database: any) {
    Routes(server, configs, database);
}