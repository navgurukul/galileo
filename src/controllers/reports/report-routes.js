"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Joi = require("joi");
// import * as Boom from "boom";
const report_controller_1 = require("./report-controller");
const report_schemas_1 = require("./report-schemas");
function default_1(server, serverConfigs, database) {
    const reportController = new report_controller_1.default(serverConfigs, database);
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
        path: '/reports/courses',
        config: {
            description: 'Progress report of courses for all the mentee assgin to a Mentor or a center to a facilitator.',
            response: {
                schema: Joi.object({
                    menteesCoursesReport: Joi.array().items(report_schemas_1.courseReportSchema),
                    mentees: Joi.array().items(report_schemas_1.menteeSchema),
                })
            },
            auth: 'jwt',
            tags: ['api'],
            handler: reportController.getMenteesCoursesReport,
        }
    });
    server.route({
        method: 'GET',
        path: '/reports/course/{courseId}',
        config: {
            description: 'Progress report of exercises of a course for all the mentee assgin to a Mentor' +
                ' or a center to a facilitator.',
            validate: {
                params: {
                    courseId: Joi.number(),
                }
            },
            response: {
            // schema: Joi.object({
            //     courseId: Joi.number(),
            //     courseName: Joi.string(),
            //     courseType: Joi.string(),
            //     courseLogo: Joi.string(),
            //     courseShortDescription: Joi.string(),
            //     menteesExercisesReport: Joi.array().items(exerciseReportSchema),
            //     mentees: Joi.array().items(menteeSchema),
            // })
            },
            auth: 'jwt',
            tags: ['api'],
            handler: reportController.getMenteesExercisesReport,
        }
    });
    server.route({
        method: 'GET',
        path: '/reports/assignmentSubmissionPending',
        config: {
            description: 'count the no of submission done by student center wise who has a center ',
            validate: {
                query: {
                    centerId: Joi.string().required(),
                    timePeriod: Joi.string().default('today'),
                }
            },
            response: {
                schema: Joi.object({
                    numberOfPendingRequests: Joi.number(),
                    numberOfRequestCreated: Joi.object({
                        requestTodays: Joi.number(),
                        requestYesterday: Joi.number(),
                        requestLastWeek: Joi.number(),
                        requestLastMonth: Joi.number(),
                    })
                })
            },
            //auth: 'jwt',
            tags: ['api'],
            handler: reportController.numberOfAssignmentSubmitted,
        }
    });
    server.route({
        method: 'GET',
        path: '/reports/assignmentSubmissionPendingPerUser',
        config: {
            description: 'Get the submission report center wise per user ',
            validate: {
                query: {
                    centerId: Joi.string().required(),
                }
            },
            response: {
                schema: Joi.array().items(Joi.object({
                    name: Joi.string(),
                    numberOfAssignmentSubmitted: Joi.number(),
                }))
            },
            auth: 'jwt',
            tags: ['api'],
            handler: reportController.numberOfAssignmentSubmittedPerUser,
        }
    });
    server.route({
        method: 'GET',
        path: '/reports/getSubmissionReport',
        config: {
            description: 'This route is to send admin the total submission report in email center wise and all ',
            validate: {
            // query: {
            //     centerId: Joi.string().required(),
            // }
            },
            response: {
            // schema:Joi.array().items( Joi.object({
            //     name: Joi.string(),
            //     numberOfAssignmentSubmitted: Joi.number(),
            // }))
            },
            // auth: 'jwt',
            tags: ['api'],
            handler: reportController.sendSubmissionReport,
        }
    });
}
exports.default = default_1;
//# sourceMappingURL=report-routes.js.map