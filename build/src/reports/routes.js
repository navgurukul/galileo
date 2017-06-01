"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Joi = require("joi");
const report_controller_1 = require("./report-controller");
const schemas_1 = require("./schemas");
function default_1(server, serverConfigs, database) {
    const reportController = new report_controller_1.default(serverConfigs, database);
    server.bind(reportController);
    server.route({
        method: 'GET',
        path: '/reports/batch/{batchId}/course/{courseId}',
        config: {
            description: 'Details of all excercise attempts of the given batch and course.',
            response: {
                schema: Joi.object({
                    "data": Joi.array().items(schemas_1.exerciseReportSchema),
                })
            },
            auth: 'jwt',
            tags: ['api'],
            handler: reportController.getBatchCourseReport
        }
    });
}
exports.default = default_1;
//# sourceMappingURL=routes.js.map