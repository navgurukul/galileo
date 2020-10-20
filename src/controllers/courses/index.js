"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
const course_routes_1 = require("./course-routes");
function init(server, configs, database) {
    course_routes_1.default(server, configs, database);
}
exports.init = init;
//# sourceMappingURL=index.js.map