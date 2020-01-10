import * as Hapi from "hapi";
import * as Joi from "joi";
import {IServerConfigurations} from "../../configurations";
// import * as Boom from "boom";
const Readable = require('stream').Readable;

import AssignmentController from "./assignment-controller";
import {exerciseSubmission, postSubmission} from "./assignment-schemas";

module.exports =  function (server: Hapi.Server, serverConfigs: IServerConfigurations, database: any) {

    const assignmentController = new AssignmentController(serverConfigs, database);
    server.bind(assignmentController);

    server.route({
        method: 'POST',
        path: '/courses/{courseId}/exercise/{exerciseId}/submission',
        config: {
            description: 'Do an exercise submission.',
            validate: {
                params: {
                    courseId: Joi.number(),
                    exerciseId: Joi.number()
                },
                payload: Joi.object({
                    // manualDone: Joi.bool(),
                    // files: Joi.array().items(Joi.string().uri())
                    //     .description("List of URLs of submitted files"),
                    notes: Joi.string()
                })
                    // .without('manualDone', ['files', 'notes'])
                    // .without('files', 'manualDone')
                    // .without('notes', 'manualDone')
            },
            response: {
                schema: postSubmission
            },
            auth: 'jwt',
            tags: ['api'],
            handler: assignmentController.postExerciseSubmission
        }
    });

    server.route({
        method: 'POST',
        path: '/courses/{courseId}/exercise/{exerciseId}/submission/upload_files',
        config: {
            description: "Uploads the given file and returns a URL for the file",
            payload: {
                output: 'stream',
                parse: true,
                maxBytes: 52428800,
                allow: 'multipart/form-data',
            },
            validate: {
                params: {
                    courseId: Joi.number(),
                    exerciseId: Joi.number()
                },
                payload: {
                    file: Joi.object()
                        .type(Readable).required()
                        .meta({ swaggerType: 'file' })
                        .description('The file which needs to be uploaded.')
                }
            },
            response: {
                schema: Joi.object({
                    success: Joi.bool().required(),
                    filePath: Joi.string()
                })
            },
            plugins: {
                'hapi-swagger': { payloadType: 'form' }
            },
            tags: ['api'],
            handler: assignmentController.uploadExerciseAssignment,
            auth: 'jwt'
        }
    });

    server.route({
        method: 'GET',
        path: '/courses/{courseId}/exercise/{exerciseId}/submission',
        config: {
            description: 'List of all submissions on an exercise.',
            validate: {
                params: {
                    courseId: Joi.number(),
                    exerciseId: Joi.number(),
                },
                query: {
                    submissionUsers: Joi.string().allow('current', 'all')
                        .required()
                        .description('Submissions for the current user or all the users?'),
                    submissionState: Joi.string().allow('pending', 'completed', 'rejected', 'all').required()
                }
            },
            response: {
                schema: Joi.object({
                    data: Joi.array().items(exerciseSubmission)
                        .description("List of submissions.")
                })
            },
            // auth: 'jwt',
            auth: {
                strategy: 'jwt',
                mode: 'optional'
            },
            tags: ['api'],
            handler: assignmentController.getExerciseSubmissions,
        }
    });

    server.route({
        method: 'GET',
        path: '/courses/{courseId}/exercise/{exerciseId}/submission/{submissionId}',
        config: {
            description: 'Details of submission of given ID.',
            validate: {
                params: {
                    courseId: Joi.number(),
                    exerciseId: Joi.number(),
                    submissionId: Joi.number()
                }
            },
            response: {
                schema: exerciseSubmission
            },
            auth: 'jwt',
            tags: ['api'],
            handler: assignmentController.getExerciseSubmissionById
        }
    });

    server.route({
        method: 'GET',
        path: '/assignments/peerReview',
        config: {
            description: 'List of peer review requests.',
            response: {
                // schema: Joi.object({
                //     // 'data': Joi.array().items(peerReviewSubmission)
                // })
            },
            auth: 'jwt',
            tags: ['api'],
            handler: assignmentController.getPeerReviewRequests
        }
    });

    server.route({
        method: 'PUT',
        path: '/assignments/peerReview/{submissionId}',
        config: {
            description: 'Approve/dis-approve a peer review request.',
            validate: {
                params: {
                    submissionId: Joi.number()
                },
                payload: Joi.object({
                    approved: Joi.bool().required(),
                    notes: Joi.string()
                })
            },
            response: {
                schema: Joi.object({
                    'success': Joi.bool()
                })
            },
            auth: 'jwt',
            tags: ['api'],
            handler: assignmentController.editPeerReviewRequest
        }
    });

}
