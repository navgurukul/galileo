import { IServerConfigurations } from '../configurations/index';
import database from '../index';
import DBTable from './dbtable';

export class NotesModel extends DBTable {
    configs: any;

    constructor(configs: IServerConfigurations) {
        super(database, 'notes');
        this.configs = configs;
    }

    public getUserNotes(userId) {
        return this.database.select('notes.id', 'notes.text', 'notes.createdAt', 'users.name')
            .from(this.tableName)
            .join('users', 'notes.facilitator', 'users.id')
            .where({
                'notes.student': userId
            })
            .then((rows) => {
                return rows;
            });
    }
}