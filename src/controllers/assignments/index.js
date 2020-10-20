"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
const assignment_routes_1 = require("./assignment-routes");
function init(server, configs, database) {
    assignment_routes_1.default(server, configs, database);
}
exports.init = init;
//# sourceMappingURL=index.js.map