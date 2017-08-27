//ignore this
// import * as Mongoose from "mongoose";
import database from '../index';
import DBTable from './dbtable';
import {IServerConfigurations} from "../configurations/index";

export class NotesModel extends DBTable {
    configs: any;

    constructor(configs: IServerConfigurations) {
        super(database, "notes");
        console.log(configs);
        this.configs = configs;
    }

    public getUserNotes(userId) {
        this.database.select('notes.id', 'notes.text', 'notes.createdAt', 'users.name')
            .join('users', 'notes.facilitator', 'users.id')
            .where({
                'notes.student': userId
            })
            .then((rows) => {
                return {data: rows};
            });
    }
}