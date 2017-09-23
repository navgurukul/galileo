import {IDataConfiguration} from "./configurations";

export function init(config: IDataConfiguration): any {
    let database: any = require('knex')(config);
    return database;
}