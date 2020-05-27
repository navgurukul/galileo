import { IServerConfigurations } from '../configurations/index';
import database from '../index';
import DBTable from './dbtable';

export class NotesModel extends DBTable {
    configs: any;

    constructor(configs: IServerConfigurations) {
        super(database, 'notes');
        this.configs = configs;
    }

    public getUserNotes(user_id) {
        return this.database.select('notes.id', 'notes.text', 'notes.created_at', 'users.name')
            .from(this.tableName)
            .join('users', 'notes.facilitator', 'users.id')
            .where({
                'notes.student': user_id
            })
            .then((rows) => {
                return rows;
            });
    }
}