"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Joi = require("joi");
const assignment_controller_1 = require("./assignment-controller");
const schemas_1 = require("./schemas");
function default_1(server, serverConfigs, database) {
    const assignmentController = new assignment_controller_1.default(serverConfigs, database);
    server.bind(assignmentController);
    server.route({
        method: 'POST',
        path: '/courses/{courseId}/exercise/{exerciseId}/submission',
        config: {
            description: 'Do a submission for an exercise.',
            validate: {
                params: {
                    courseId: Joi.number(),
                    exerciseId: Joi.number()
                },
                payload: schemas_1.exerciseSubmissionPayload
            },
            response: {
                schema: schemas_1.exerciseSubmission
            },
            auth: 'jwt',
            tags: ['api'],
            handler: assignmentController.postExerciseSubmission
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
                    exerciseId: Joi.number()
                }
            },
            response: {
                schema: Joi.object({
                    data: Joi.array().items(schemas_1.exerciseSubmission)
                        .description("List of submissions.")
                })
            },
            auth: 'jwt',
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
                    exerciseId: Joi.number()
                }
            },
            response: {
                schema: schemas_1.exerciseSubmission
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
            response: {},
            auth: 'jwt',
            tags: ['api'],
            handler: assignmentController.getPeerReviewRequests
        }
    });
    server.route({
        method: 'PUT',
        path: '/assignments/peerReview/{requestId}',
        config: {
            description: 'Approve/dis-approve a peer review request.',
            validate: {
                payload: Joi.object({
                    approved: Joi.bool().default(true),
                    notes: null
                })
            },
            response: {
                schema: schemas_1.peerReview
            },
            auth: 'jwt',
            tags: ['api'],
            handler: assignmentController.editPeerReviewRequest
        }
    });
}
exports.default = default_1;
//# sourceMappingURL=routes.js.map