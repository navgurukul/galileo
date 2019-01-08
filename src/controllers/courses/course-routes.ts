import * as Hapi from "hapi";
import * as Joi from "joi";
import {IServerConfigurations} from "../../configurations";

import CourseController from "./course-controller";
import {
          courseSchema,
          enrolledCourseSchema,
          completedCoursesSchema,
          exerciseSchema,
          topicSchema,
          courseSequenceSchema,
        } from "./course-schemas";

export default function (server: Hapi.Server, serverConfigs: IServerConfigurations, database: any) {

    const courseController = new CourseController(serverConfigs, database);
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
                    "availableCourses": Joi.array().items(courseSchema),
                    "enrolledCourses": Joi.array().items(enrolledCourseSchema),
                    "completedCourses": Joi.array().items(completedCoursesSchema),
                })
            },
            auth: {
                strategy: 'jwt',
                mode: 'optional'
            },
            tags: ['api'],
            handler: courseController.getCoursesList
        }
    });

    server.route({
        method: 'GET',
        path: '/courses/{courseId}/topics',
        config: {
            description: 'Get complete list of topics in the course',
            validate: {
                params: {
                    courseId: Joi.number().required()
                }
            },
            response: {
                schema: Joi.object({
                    "data": Joi.array().items(topicSchema)
                })
            },
            tags: ['api'],
            handler: courseController.getCourseTopics
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
                    "data": Joi.array().items(exerciseSchema)
                })
            },
            auth: {
                strategy: 'jwt',
                mode: 'optional'
            },
            tags: ['api'],
            handler: courseController.getCourseExercises
        }
    });

    server.route({
        method: 'GET',
        path: '/courses/{courseId}/exercise/getBySlug',
        config: {
            description: 'Get complete details of the exercise with the given slug. Does not return child exercises.',
            validate: {
                params: {
                    courseId: Joi.number(),
                },
                query: {
                    slug: Joi.string().description('write exercise slug here')
                }
            },
            // response: {
            //     schema: exerciseSchema
            // },
            auth: {
                strategy: 'jwt',
                mode: 'optional'
            },
            tags: ['api'],
            handler: courseController.getExerciseBySlug
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

    server.route({
        method: 'DELETE',
        path: '/courses/{courseId}/delete',
        config: {
            description: 'Delete the course with the given course id.',
            validate: {
                params: {
                    courseId: Joi.number()
                }
            },
            response: {
                schema: {
                    "deleted": Joi.bool()
                }
            },
            auth: 'jwt',
            tags: ['api'],
            handler: courseController.deleteCourse
        }
    });

    server.route({
        method: 'PUT',
        path: '/courses/sequenceNum',
        config: {
            description: 'Updates the sequence number of all the courses.',
            validate: {
                payload: {
                    courses: Joi.array().items(courseSequenceSchema)
                }
            },
            response: {
                schema: {
                    "success": Joi.bool()
                }
            },
            auth: 'jwt',
            tags: ['api'],
            handler: courseController.updateCourseSequence
        }
    });

    server.route({
        method: 'POST',
        path: '/courses/{courseId}/complete',
        config: {
            description: 'Updates the sequence number of all the courses.',
            validate: {
                params: {
                    courseId: Joi.number().required(),
                },
                payload: {
                    menteeId: Joi.number().required(),
                }
            },
            response: {
                schema: {
                    "success": Joi.bool()
                }
            },
            // auth: 'jwt',
            tags: ['api'],
            handler: courseController.courseComplete
        }
    });
}
