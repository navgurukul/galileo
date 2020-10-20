"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
const user_routes_1 = require("./user-routes");
function init(server, configs, database) {
    user_routes_1.default(server, configs, database);
}
exports.init = init;
//# sourceMappingURL=index.js.map