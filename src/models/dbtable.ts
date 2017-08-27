export default class DBTable {

    public database: any;
    public tableName: any;

    constructor(database: any, tableName: string) {
        this.tableName = tableName;
        this.database = database;
    }

    public findOne(whereClause): Promise<any> {
        return this.findMany(whereClause)
            .then((rows) => {
                if (!rows) {
                    return Promise.resolve(null);
                } else {
                    return Promise.resolve(rows[0]);
                }
            })
            .catch((err) => {
                return Promise.resolve(null);
            });
    }

    public findMany(whereClause, columnsList?): Promise<any> {
        console.log(columnsList);
        //Checking whether we need specific columns or not
        let dbInstance;
        if (columnsList && columnsList.length > 0) {
            dbInstance = this.database.column(columnsList);
        } else {
            dbInstance = this.database;
        }

        return dbInstance.select()
            .from(this.tableName)
            .where(whereClause)
            .then(function (rows) {
                console.log(rows);
                if (!rows) {
                    return Promise.resolve(null);
                } else {
                    return Promise.resolve(rows);
                }
            })
            .catch((err) => {
                return Promise.resolve(null);
            });
    }

    public upsert(obj: any, whereClause: any, isReturnObj = false): Promise<any> {
        return this.findMany(whereClause)
            .then((rows) => {
                if (rows && rows.length === 0) {
                    return this.insert(obj);
                } else {
                    return this.update(obj, whereClause);
                }
            })
            .then((prevPromise) => {
                console.log('isReturnObj' + isReturnObj);
                if (isReturnObj) {
                    return this.findOne(whereClause);
                } else {
                    return Promise.resolve(prevPromise);
                }
            });
    }

    public update(obj: any, whereClause: any) {
        return this.database(this.tableName)
            .update(obj)
            .where(whereClause)
            .then((numRows) => {
                return Promise.resolve(true);
            })
            .catch((err) => {
                return Promise.resolve(false);
            });
    }

    public insert(obj: any): Promise<any> {
        return this.database(this.tableName)
            .insert(obj)
            .then((id) => {
                return Promise.resolve(true);
            })
            .catch((err) => {
                return Promise.resolve(false);
            });
    }

    public del(id: any) {
        return this.database(this.tableName)
            .where('id', id)
            .del()
            .then((rows, count) => {
                return {success: true};
            });
    }
}