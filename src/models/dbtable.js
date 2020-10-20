"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DBTable {
    constructor(database, tableName) {
        this.tableName = tableName;
        this.database = database;
    }
    findOne(whereClause) {
        return this.findMany(whereClause)
            .then((rows) => {
            if (!rows) {
                return Promise.resolve(null);
            }
            else {
                return Promise.resolve(rows[0]);
            }
        })
            .catch((err) => {
            return Promise.resolve(null);
        });
    }
    findMany(whereClause, columnsList) {
        //Checking whether we need specific columns or not
        let dbInstance;
        if (columnsList && columnsList.length > 0) {
            dbInstance = this.database.column(columnsList);
        }
        else {
            dbInstance = this.database;
        }
        return dbInstance.select()
            .from(this.tableName)
            .where(whereClause)
            .then(function (rows) {
            if (!rows) {
                return Promise.resolve(null);
            }
            else {
                return Promise.resolve(rows);
            }
        })
            .catch((err) => {
            return Promise.resolve(null);
        });
    }
    upsert(obj, whereClause, isReturnObj = false) {
        return this.findMany(whereClause)
            .then((rows) => {
            if (rows && rows.length === 0) {
                return this.insert(obj);
            }
            else {
                return this.update(obj, whereClause);
            }
        })
            .then((prevPromise) => {
            if (isReturnObj) {
                return this.findOne(whereClause);
            }
            else {
                return Promise.resolve(prevPromise);
            }
        });
    }
    update(obj, whereClause) {
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
    insert(obj) {
        return this.database(this.tableName)
            .insert(obj)
            .then((id) => {
            return Promise.resolve(true);
        })
            .catch((err) => {
            return Promise.resolve(false);
        });
    }
    del(id) {
        return this.database(this.tableName)
            .where('id', id)
            .del()
            .then((count) => {
            // TODO: Don't know if we should return false in case no rows are affected.
            if (count <= 0) {
                return Promise.resolve(false);
            }
            else {
                return Promise.resolve(true);
            }
        })
            .catch((err) => {
            return Promise.resolve(false);
        });
    }
}
exports.default = DBTable;
//# sourceMappingURL=dbtable.js.map