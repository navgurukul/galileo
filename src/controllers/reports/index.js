"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
const report_routes_1 = require("./report-routes");
function init(server, configs, database) {
    report_routes_1.default(server, configs, database);
}
exports.init = init;
//# sourceMappingURL=index.js.map