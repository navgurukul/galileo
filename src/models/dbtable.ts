export default class DBTable {
    public tableName: string;
    public database: any;

    constructor(database: any, tableName: string) {
        this.database = database;
        this.tableName = tableName;
    }

    public findOne(whereClause): Promise<any> {
        return this.database.select('*').from(this.tableName)
            .where(whereClause)
            .then(function (rows) {
                if (!rows) {
                    return Promise.resolve(null);
                } else {
                    return Promise.resolve(rows[0]);
                }
            });
    }

    public upsert(obj: any, whereClause: any, isReturnObj = false): Promise<any> {
        return this.database(this.tableName)
            .select()
            .where(whereClause)
            .then((rows) => {
                console.log('rows length:' + rows.length);
                if (rows.length === 0) {
                    return this.insert(obj);
                } else {
                    return this.update(obj, whereClause);
                }
            })
            .then((prevPromise) => {
                if (isReturnObj) {
                    return this.findOne(whereClause);
                } else {
                    return Promise.resolve(prevPromise);
                }
            });
    }

    public update(obj: any, whereClause: any) {
        console.log(this.database.update(obj).where(whereClause).toSQL());
        return this.database.update(obj)
            .where(whereClause)
            .then(
                (numRows) => {
                    return Promise.resolve(true);
                }
            );
    }

    public insert(obj: any): Promise<any> {
        return this.database.insert(obj)
            .then((id) => {
                return Promise.resolve(true);
            });
    }
}