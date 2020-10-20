"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
function init(config) {
    let database = require('knex')(config);
    return database;
}
exports.init = init;
//# sourceMappingURL=database.js.map