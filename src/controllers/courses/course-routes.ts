import * as Hapi from "hapi";
import * as Joi from "joi";
import { IServerConfigurations } from "../../configurations";

import CourseController from "./course-controller";
import {
    courseSchema,
    enrolledCourseSchema,
    completedCoursesSchema,
    exerciseSchema,
    topicSchema,
    courseSequenceSchema,
} from "./course-schemas";

import { userRoleSchema } from "../users/user-schemas";
import { join } from "path";

export default function (server: Hapi.Server, serverConfigs: IServerConfigurations, database: any) {

    const courseController = new CourseController(serverConfigs, database);
    server.bind(courseController);

    server.route({
        method: 'GET',
        path: '/courses',
        config: {
            description: 'List of courses under 3 categories: \
                            1. User has enrolled in. \
                            2. User has completed. \
                            3. Courses that a user can do next.',
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
        path: '/courses/{exerciseId}/solution',
        config: {
            description: 'gets the solution by exercies Id.',
            validate: {
                params: {
                    exerciseId: Joi.number(),
                }
            },

            // auth: {
            //     strategy: 'jwt',
            //     mode: 'optional'
            // },
            tags: ['api'],
            handler: courseController.getSolutionByExerciseId
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
        path: '/courseRelation/{courseId}/{reliesOn}/add',
        config: {
            description: 'Add course relation in the course with the given ID.',
            validate: {
                params: {
                    // userId: Joi.number(),
                    courseId: Joi.number(),
                    reliesOn: Joi.number().description("Id of the course on which courseId relies on."),
                }
            },
            response: {
                schema: {
                    "Added": Joi.bool()
                }
            },
            auth: 'jwt',
            tags: ['api'],
            handler: courseController.addCourseRelation
        }
    });

    server.route({
        method: 'GET',
        path: '/courseRelation',
        config: {
            description: 'Get complete list of course relations for all the courses',
            response: {
                schema: Joi.object({
                    "data": Joi.array().items(exerciseSchema)
                })
            },
            tags: ['api'],
            handler: courseController.getCourseRelationList
        }
    });

    server.route({
        method: 'DELETE',
        path: '/courseRelation/{courseId}/{reliesOn}/delete',
        config: {
            description: 'Delete the courseRelation with the given course id.',
            validate: {
                params: {
                    courseId: Joi.number(),
                    reliesOn: Joi.number()
                }
            },
            response: {
                schema: {
                    "deleted": Joi.bool()
                }
            },
            tags: ['api'],
            handler: courseController.deleteCourseRelation
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
            tags: ['api'],
            handler: courseController.courseComplete
        }
    });

    server.route({
        method: 'GET',
        path: '/courses/studentsWithoutMentor',
        config: {
            description: 'Get complete list of student for whome mentore has not been assigned',
            validate: {
                query: {
                    centerId: Joi.string().allow(null),
                }
            },
            response: {

                schema: Joi.object({
                    "data": Joi.array().items(userRoleSchema)
                })

            },
            tags: ['api'],
            handler: courseController.getStudentsWithoutMentorList
        }
    });

    server.route({
        method: 'GET',
        path: '/courses/studentsWithMentor/{mentorId}',
        config: {
            description: `Get complete list of student with a mentor 
                           where mentorId will be params and centerId 
                           will be query parameter`,
            validate: {
                query:{
                    centerId: Joi.string().allow(null)
                },
                params: {
                    mentorId: Joi.number().required()
                    
                }
            },
            response: {

                schema: Joi.object({
                    "data": Joi.array().items(userRoleSchema)
                })

            },
            tags: ['api'],
            handler: courseController.getStudentsWithMentorList
        }
    });

    server.route({
        method: 'GET',
        path: '/courses/centerMentorMentee',
        config: {
            description: `Get complete list of student and mentor
                          where pass centerId as a query parameter `,
            validate: {
                query: {

                    centerId: Joi.string().allow(null)
                }
            },
            response: {

                // schema: Joi.object({
                //     'mentorListResult': Joi.array().items(userRoleSchema),
                //    // 'menteeListResult': Joi.array().items(userRoleSchema)

                // })

                schema: Joi.array()

            },
            tags: ['api'],
            handler: courseController.getMentorsOrMenteesList
        }
    });


    server.route({
        method: 'DELETE',
        path: '/courses/deleteMenteeMentor/{menteeId}/{mentorId}',
        config: {
            description: 'Delete the mentor and mentee record.',
            validate: {
                params: {
                    mentorId: Joi.number(),
                    menteeId: Joi.number()
                }

            },
            response: {
                schema: {
                    "deleted": Joi.bool()
                }
            },
            // auth: 'jwt',
            tags: ['api'],
            handler: courseController.deleteMentorMentee
        }
    });

    server.route({
        method: 'DELETE',
        path: '/courses/deleteMenteeByIdMentorByEmailOrId',
        config: {
            description: 'Delete the mentee by id and mentor by id or email.',
            validate: {
                
                payload: {
                    mentorId: Joi.number().allow(null),
                    mentorEmail: Joi.string().email().allow(null),
                    menteeId: Joi.number()
                }
               

            },
            response: {
                schema: {
                    "deleted": Joi.bool()
                }
            },
            // auth: 'jwt',
            tags: ['api'],
            handler: courseController.deleteMentorMenteeByidOrEmail
        }
    });


}