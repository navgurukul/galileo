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
            description: 'List of courses under 3 categories: \
                          1. User has enrolled in. \
                          2. User is facilitating. \
                          3. All courses (includes courses from 1 and 2.)',
            response: {
                schema: Joi.object({
                    "facilitatingCourses": schemas_1.facilitatingCourseSchema,
                    "enrolledCourses": schemas_1.enrolledCourseSchema,
                    "availableCourses": schemas_1.courseSchema
                })
            },
            auth: 'jwt',
            tags: ['api'],
            handler: courseController.getCoursesList
        }
    });
    server.route({
        method: 'GET',
        path: '/courses/{courseId}/exercises',
        config: {
            description: 'Get complete list of exercises in the course',
            validate: {
                params: {
                    courseId: Joi.number().required()
                }
            },
            response: {
                schema: Joi.object({
                    "data": Joi.array().items(schemas_1.exerciseSchema)
                })
            },
            auth: 'jwt',
            tags: ['api'],
            handler: courseController.getCourseExercises
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
                schema: schemas_1.exerciseSchema
            },
            auth: 'jwt',
            tags: ['api'],
            handler: courseController.getExerciseById
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
                    "notes": Joi.string()
                        .default("# Notes Title ## Not sub-title Some content. \n More.")
                        .description("Notes in markdown.")
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
                schema: {
                    "enrolled": Joi.bool()
                }
            },
            auth: 'jwt',
            tags: ['api'],
            handler: courseController.enrollInCourse
        }
    });
}
exports.default = default_1;
//# sourceMappingURL=routes.js.map