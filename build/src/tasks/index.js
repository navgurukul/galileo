"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routes_1 = require("./routes");
function init(server, configs, database) {
    routes_1.default(server, configs, database);
}
exports.init = init;
//# sourceMappingURL=index.js.map