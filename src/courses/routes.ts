import * as Hapi from "hapi";
import * as Joi from "joi";
import { IServerConfigurations } from "../configurations";
import * as Boom from "boom";

import CourseController from "./course-controller";
import { courseSchema, enrolledOrFacilitatingCourseSchema,
         exerciseSchema, enrolledExerciseSchema } from "./schemas";

export default function (server: Hapi.Server, serverConfigs: IServerConfigurations, database: any) {

    const courseController = new CourseController(serverConfigs, database);
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
                    "data": Joi.array().items(courseSchema, enrolledOrFacilitatingCourseSchema),
                })
            },
            tags: ['api'],
            handler: courseController.getCoursesList
        }
    });

    server.route({
        method: 'GET',
        path: '/courses/{courseId}/exercise',
        config: {
            description: 'Get complete details of the exercise with the given ID.',
            validate: {
                params: {
                    courseId: Joi.number()
                }
            },
            response: {
                schema: enrolledExerciseSchema
            },
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
                    "notes": Joi.string().default("# Notes Title ## Not sub-title Some content. \n More.")
                })
            },
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
                schema: enrolledOrFacilitatingCourseSchema.description("`enrolled` flag is true now.")
            },
            auth: 'jwt',
            tags: ['api'],
            handler: courseController.enrollInCourse
        }
    });

}
