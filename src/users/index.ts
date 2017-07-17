import * as Hapi from "hapi";
import Routes from "./routes";
import { IServerConfigurations } from "../configurations";
import * as Users from './users';

export function init(server: Hapi.Server, configs: IServerConfigurations, database: any) {

    Users.defineModel(database).then((user) => {
        console.log(user);
        const a = user.build({
            id: 1,
            title: 'hello world'
        });
        a.save().then(()=> {
            console.log('very good')
        }).catch((err) => {
            console.log(err);
        });
        Routes(server, configs, user);
    })
}