import * as Hapi from "hapi";
import * as Joi from "joi";
import {IServerConfigurations} from "../../configurations";
import * as Boom from "boom";

import ReportController from "./report-controller";
import {
    menteesReportSchema
} from "./report-schemas";

export default function (server: Hapi.Server, serverConfigs: IServerConfigurations, database: any) {

    const reportController = new ReportController(serverConfigs, database);
    server.bind(reportController);

    // server.route({
    //     method: 'GET',
    //     path: '/reports/batch/{batchId}/course/{courseId}',
    //     config: {
    //         description: 'Details of all excercise attempts of the given batch and course.',
    //         validate: {
    //             params: {
    //                 batchId: Joi.number().required(),
    //                 courseId: Joi.number().required()
    //             }
    //         },
    //         // #TODO: Leaving out the response right now.
    //         // Will add when we re-factor the code.
    //         // response: {
    //         //     schema: Joi.object({
    //         //         "data": Joi.array().items(exerciseReportSchema),
    //         //     })
    //         // },
    //         auth: 'jwt',
    //         tags: ['api'],
    //         handler: reportController.getBatchCourseReport
    //     }
    // });

    server.route({
        method: 'GET',
        path: '/reports/users/{userId}/course/{courseId}',
        config: {
            description: 'List of all submissions on a course by a user.',
            validate: {
                params: {
                    courseId: Joi.number(),
                    userId: Joi.number(),
                }
            },
            // response: {
            //     schema: Joi.object({
            //         data: Joi.array().items(exerciseSubmission)
            //               .description("List of submissions.")
            //     })
            // },
            auth: 'jwt',
            tags: ['api'],
            handler: reportController.getStudentReport,
        }
    });
    
    server.route({
        method: 'GET',
        path: '/reports/users/getMenteesReport',
        config: {
            description: 'List of all Mentees assgin to a Mentor.',

            response: {
                schema: Joi.object({
                    data: Joi.array().items(menteesReportSchema)
                          .description("List of Mentees for the current user.")
                })
            },
            auth: 'jwt',
            tags: ['api'],
            handler: reportController.getMenteesReport,
        }
    });

}
