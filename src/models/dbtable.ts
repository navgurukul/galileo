export default class DBTable {
    public tableName: string;
    public database: any;

    constructor(database: any, tableName: string) {
        this.database = database;
        this.tableName = tableName;
    }
}