"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Joi = require("joi");
const course_controller_1 = require("./course-controller");
const schemas_1 = require("./schemas");
function default_1(server, serverConfigs, database) {
    const courseController = new course_controller_1.default(serverConfigs, database);
    server.bind(courseController);
    server.route({
        method: 'GET',
        path: '/courses',
        config: {
            description: 'List of courses under 3 categories: \n \
                          1. User has enrolled in. \n \
                          2. User is facilitating. \n \
                          3. All courses (includes courses from 1 and 2.)',
            validate: {
                params: {
                    facilitating: Joi.bool().default(true),
                    enrolled: Joi.bool().default(true),
                    allAvailable: Joi.bool().default(true)
                }
            },
            response: {
                schema: Joi.object({
                    "data": Joi.array(),
                })
            },
            auth: 'jwt',
            tags: ['api'],
            handler: courseController.getCoursesList
        }
    });
    server.route({
        method: 'GET',
        path: '/courses/{courseId}/exercise/{exerciseId}',
        config: {
            description: 'Get complete details of the exercise with the given ID.',
            validate: {
                params: {
                    courseId: Joi.number(),
                    exerciseId: Joi.number()
                }
            },
            response: {
                schema: schemas_1.enrolledExerciseSchema
            },
            auth: 'jwt',
            tags: ['api'],
            handler: courseController.getExerciseById
        }
    });
    server.route({
        method: 'GET',
        path: '/courses/{courseId}/exercises',
        config: {
            description: 'Get complete list of exercises in the course',
            validate: {
                params: {
                    courseId: Joi.number()
                }
            },
            response: {},
            auth: 'jwt',
            tags: ['api'],
            handler: courseController.getCourseExercises
        }
    });
    server.route({
        method: 'GET',
        path: '/courses/{courseId}/notes',
        config: {
            description: 'Get any additional notes attached with the course.',
            validate: {
                params: {
                    courseId: Joi.number()
                }
            },
            response: {
                schema: Joi.object({
                    "notes": Joi.string().default("# Notes Title ## Not sub-title Some content. \n More.")
                })
            },
            auth: 'jwt',
            tags: ['api'],
            handler: courseController.getCourseNotes
        }
    });
    server.route({
        method: 'POST',
        path: '/courses/{courseId}/enroll',
        config: {
            description: 'Enroll in the course with the given ID.',
            validate: {
                params: {
                    courseId: Joi.number()
                }
            },
            response: {
                schema: schemas_1.enrolledOrFacilitatingCourseSchema.description("`enrolled` flag is true now.")
            },
            auth: 'jwt',
            tags: ['api'],
            handler: courseController.enrollInCourse
        }
    });
}
exports.default = default_1;
//# sourceMappingURL=routes.js.map