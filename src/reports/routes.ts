import * as Hapi from "hapi";
import * as Joi from "joi";
import { IServerConfigurations } from "../configurations";
import * as Boom from "boom";

import ReportController from "./report-controller";
import { exerciseReportSchema } from "./schemas";

export default function (server: Hapi.Server, serverConfigs: IServerConfigurations, database: any) {

    const reportController = new ReportController(serverConfigs, database);
    server.bind(reportController);

    server.route({
        method: 'GET',
        path: '/reports/batch/{batchId}/course/{courseId}',
        config: {
            description: 'Details of all excercise attempts of the given batch and course.',
            response: {
                schema: Joi.object({
                    "data": Joi.array().items(exerciseReportSchema),
                })
            },
            auth: 'jwt',
            tags: ['api'],
            handler: reportController.getBatchCourseReport
        }
    });

}
