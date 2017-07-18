import * as Hapi from "hapi";
import Routes from "./routes";
import { IServerConfigurations } from "../configurations";
import * as Users from './users';

export function init(server: Hapi.Server, configs: IServerConfigurations, database: any) {

    Users.defineModel(database).then((user) => {
        Routes(server, configs, user);
    })
}