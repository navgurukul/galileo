export default class DBTable {
    tableName: string;
    database: any;

    constructor(database: any, tableName: string) {
        this.database = database;
        this.tableName = tableName;
    }

   // table name, reference of db
   public getFirstElement() {
        this.database.select().first().then(rows => {
        });
       //return first row 
   }
}