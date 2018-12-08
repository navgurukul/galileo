import * as Boom from 'boom';
import * as Hapi from 'hapi';
import * as knex from 'knex';

import database from '../../';
import { IServerConfigurations } from '../../configurations/index';


export default class CourseController {

    private configs: IServerConfigurations;
    private database: any;
    private user: any;

    constructor(configs: IServerConfigurations, database: any) {
        this.database = database;
        this.configs = configs;
    }

    public getCoursesList(request: Hapi.Request, reply: Hapi.IReply) {
        let facilitatingCourses = [];
        let enrolledCourses = [];
        let availableCourses = [];

        let enrolledQ;
        let facilitatingQ;
        let availableQ;
        if (request.headers.authorization === undefined ){
            availableQ =
                database('courses').select('courses.id', 'courses.name', 'courses.type',
                    'courses.logo', 'courses.shortDescription', 'courses.sequenceNum')
                    .then((rows) => {
                        availableCourses = rows;
                        return Promise.resolve();
                    });

            Promise.all([availableQ]).then(() => {
                return reply({
                    'availableCourses': availableCourses
                });
            });

        } else if (request.headers.authorization !== ""){
            enrolledQ =
                database('course_enrolments')
                    .select('courses.id', 'courses.name', 'courses.type',
                        'courses.logo', 'courses.daysToComplete',
                        'courses.shortDescription', 'courses.sequenceNum',
                        database.raw('MIN(course_enrolments.enrolledAt) as enrolledAt'),
                        // database.raw('MIN(course_enrolments.batchId) as batchId'),
                        database.raw('COUNT(exercises.id) as totalExercises'),
                        database.raw('COUNT(DISTINCT submissions.id) as completedSubmissions'))
                    .innerJoin('courses', 'course_enrolments.courseId', '=', 'courses.id')
                    .innerJoin('exercises', 'course_enrolments.courseId', 'exercises.courseId')
                    .leftJoin('submissions', function () {
                        this.on('submissions.userId', '=', request.userId)
                            .andOn('submissions.exerciseId', '=', 'exercises.id')
                            .andOn('submissions.completed', '=', 1);
                    })
                    .where({'course_enrolments.studentId': request.userId})
                    .groupBy('exercises.courseId')
                    .then((rows) => {
                        enrolledCourses = rows;
                        let lastSubmissionQueries = [];
                        for (let i = 0; i < enrolledCourses.length; i++) {
                            let oneDay = 24 * 60 * 60 * 1000;
                            enrolledCourses[i].daysSinceEnrolled = Math.abs(+new Date() - enrolledCourses[i].enrolledAt) / oneDay;
                            lastSubmissionQueries.push(
                                database('submissions')
                                    .select('exercises.name', 'exercises.slug', 'submissions.submittedAt', 'submissions.completedAt')
                                    .innerJoin('exercises', 'submissions.exerciseId', 'exercises.id')
                                    .innerJoin('courses', 'courses.id', 'exercises.courseId')
                                    .where({
                                        'exercises.courseId': enrolledCourses[i].id,
                                        'submissions.userId': request.userId
                                    })
                                    .orderBy('submissions.submittedAt', 'desc')
                                    .limit(1)
                                    .then((rows) => {
                                        if (rows.length < 1) {
                                            enrolledCourses[i].lastSubmission = {};
                                        } else {
                                            enrolledCourses[i].lastSubmission = rows[0];
                                        }
                                        return Promise.resolve();
                                    })
                            );
                        }
                        return Promise.all(lastSubmissionQueries).then(() => {
                            return Promise.resolve();
                        });
                    });

            // facilitatingQ =
            //     database('courses')
            //         .select('courses.id', 'courses.name', 'courses.type',
            //             'courses.logo','courses.shortDescription', 'courses.sequenceNum',
            //             'batches.name as batch_name', 'batches.id as batchId')
            //         .join('batches', function () {
            //             this.on('courses.id', '=', 'batches.courseId').andOn('batches.facilitatorId', request.userId);
            //         })
            //         .then((rows) => {
            //             facilitatingCourses = rows;
            //             return Promise.resolve();
            //         });

            facilitatingQ =
                database('courses')
                    .select('courses.id', 'courses.name', 'courses.type',
                        'courses.logo','courses.shortDescription', 'courses.sequenceNum')
                    .where({
                        'courses.facilitator':request.userId
                    })
                    .then((rows)=>{
                        facilitatorCourses = rows;
                        return Promise.resolve();
                    });

            // availableQ =
            //     database('courses')
            //         .select('courses.id', 'courses.name', 'courses.type',
            //           'courses.logo', 'courses.shortDescription','courses.sequenceNum')
            //         .where('courses.id', 'not in', database('courses').distinct()
            //             .select('courses.id')
            //             .join('batches', function () {
            //                 this.on('courses.id', '=', 'batches.courseId').andOn('batches.facilitatorId', '=', request.userId);
            //             })
            //             .union(function () {
            //                 this.select('courses.id').distinct().from('courses').join('course_enrolments', function () {
            //                     this.on('courses.id', '=', 'course_enrolments.courseId')
            //                         .andOn('course_enrolments.studentId', '=', request.userId);
            //                 });
            //             })
            //         )
            //         .then((rows) => {
            //             availableCourses = rows;
            //             return Promise.resolve();
            //         });

            availableQ =
                database('courses')
                    .select('courses.id', 'courses.name', 'courses.type',
                      'courses.logo', 'courses.shortDescription','courses.sequenceNum')
                    .where('courses.id', 'not in', database('courses').distinct()
                        .select('courses.id')
                        .join('course_enrolments', function () {
                            this.on('courses.id', '=', 'course_enrolments.courseId')
                                .andOn('course_enrolments.studentId', '=', request.userId);
                        })
                    )
                    .andWhere('courses.facilitator', '!=', request.userId)
                    .then((rows) => {
                        availableCourses = rows;
                        return Promise.resolve();
                    });

            Promise.all([facilitatingQ, enrolledQ, availableQ]).then(() => {
                return reply({
                    'enrolledCourses': enrolledCourses,
                    'facilitatingCourses': facilitatingCourses,
                    'availableCourses': availableCourses
                });
            });

        }

    }

    public getCourseTopics(request: Hapi.Request, reply: Hapi.IReply) {

        let exercises = [];
        let courseId = parseInt(request.params.courseId, 10);

        let query = database('exercises')
                    .select('exercises.id', 'exercises.name')
                    .where({"exercises.courseId": courseId})
                    .andWhere({"exercises.parentExerciseId": null})
                    .orderBy("exercises.sequenceNum", "asc");

        query.then((rows) => {
            return reply({data: rows});
        });

        // let xyz = '(SELECT max(submissions.id) FROM submissions WHERE exerciseId = exercises.id '
        //     + 'AND userId = ' + 1 + ' ORDER BY state ASC LIMIT 1)';

        // let query = database('exercises')
        //     .select('exercises.id', 'exercises.parentExerciseId', 'exercises.name', 'exercises.slug', 'exercises.sequenceNum',
        //         'exercises.reviewType', 'submissions.state as submissionState', 'submissions.id as submissionId',
        //         'submissions.completedAt as submissionCompleteAt', 'submissions.userId')
        //     .leftJoin('submissions', function () {
        //         this.on('submissions.id', '=',
        //             knex.raw(xyz)
        //         ).on('submissions.userId', '=', 1);
        //     })
        //     .where({'exercises.courseId': })
        //     .orderBy('exercises.sequenceNum', 'asc');

        // query.then((rows) => {
        //     let exercise = rows[0];
        //     console.log(rows);
        //     for (let i = 0; i < rows.length; i++) {
        //        if (parseInt(exercise.sequenceNum, 10) < 100) {
        //             console.log("yaha");
        //             exercise = rows[i];
        //             if (!Number.isInteger(exercise.sequenceNum)) {
        //                 let parentIndex = parseInt(exercise.sequenceNum, 10) - 1;
        //                 exercises[parentIndex].childExercises.push(exercise);
        //             } else {
        //                 exercise.childExercises = [];
        //                 exercises.push(exercise);
        //             }
        //         } else {
        //            exercise = rows[i];
        //            console.log(exercise.sequenceNum + " vahan");
        //            if (parseInt(exercise.sequenceNum, 10) %100 > 0) {
        //               let parentIndex = Math.floor( parseInt(exercise.sequenceNum, 10) / 1000 - 1);
        //               exercises[parentIndex].childExercises.push(exercise);
        //            } else {
        //               exercise.childExercises = [];
        //               exercises.push(exercise);
        //            }
        //         }
        //     }
        //     return reply({data: exercises});
        // });
    }

    public getCourseExercises(request: Hapi.Request, reply: Hapi.IReply) {

        let exercises = [];
        // let xyz = '(SELECT max(submissions.id) FROM submissions WHERE exerciseId = exercises.id '
        //     + 'AND userId = ' + 1 + ' ORDER BY state ASC LIMIT 1)';

        let query = database('exercises')
            .select('exercises.id', 'exercises.parentExerciseId', 'exercises.name', 'exercises.slug', 'exercises.sequenceNum',
                'exercises.reviewType', 'exercises.githubLink', 'exercises.submissionType')
            //  'submissions.state as submissionState','submissions.id as submissionId',
            //  'submissions.completedAt as submissionCompleteAt', 'submissions.userId')
            // .leftJoin('submissions', function () {
            //     this.on('submissions.id', '=',
            //         knex.raw(xyz)
            //     ).on('submissions.userId', '=', 1);
            // })
            .where({'exercises.courseId': parseInt(request.params.courseId, 10)})
            .orderBy('exercises.sequenceNum', 'asc');

        query.then((rows) => {
            let exercise = rows[0];
            for (let i = 0; i < rows.length; i++) {
               if (parseInt(exercise.sequenceNum, 10) < 100) {
                    exercise = rows[i];
                    if (!Number.isInteger(exercise.sequenceNum)) {
                        let parentIndex = parseInt(exercise.sequenceNum, 10) - 1;
                        exercises[parentIndex].childExercises.push(exercise);
                    } else {
                        exercise.childExercises = [];
                        exercises.push(exercise);
                    }
                } else {
                   exercise = rows[i];
                   if (parseInt(exercise.sequenceNum, 10) %100 > 0) {
                      let parentIndex = Math.floor( parseInt(exercise.sequenceNum, 10) / 1000 - 1);
                      exercises[parentIndex].childExercises.push(exercise);
                   } else {
                      exercise.childExercises = [];
                      exercises.push(exercise);
                   }
                }
            }
            return reply({data: exercises});
        });
    }

    public getExerciseById(request: Hapi.Request, reply: Hapi.IReply) {

        database('exercises')
            .select('exercises.id', 'exercises.parentExerciseId', 'exercises.name', 'exercises.slug', 'exercises.sequenceNum',
                'exercises.reviewType', 'exercises.content', 'exercises.submissionType', 'exercises.githubLink')
            //  'submissions.state as submissionState', 'submissions.id as submissionId',
            //  'submissions.completedAt as submissionCompleteAt')
            // .leftJoin('submissions', function () {
            //     this.on('submissions.id', '=',
            //         database.raw('(SELECT max(submissions.id) FROM submissions
            //             WHERE exerciseId = exercises.id ORDER BY state ASC LIMIT 1)')
            //     );
            // })
            .where({'exercises.id': request.params.exerciseId})
            .then((rows) => {
                let exercise = rows[0];
                return reply(exercise);
            });

    }

    public getExerciseBySlug(request: Hapi.Request, reply: Hapi.IReply) {

        // let xyz = '(SELECT max(submissions.id) FROM submissions WHERE exerciseId = exercises.id ' +
        //     'AND userId = ' + request.userId + '  ORDER BY state ASC LIMIT 1)';

        let query = database('exercises')
            .select('exercises.id', 'exercises.parentExerciseId', 'exercises.name', 'exercises.slug', 'exercises.sequenceNum',
                'exercises.reviewType', 'exercises.content', 'exercises.submissionType', 'exercises.githubLink')
            //  'submissions.state as submissionState', 'submissions.id as submissionId',
            //  'submissions.completedAt as submissionCompleteAt')
            // .leftJoin('submissions', function () {
            //     this.on('submissions.id', '=',
            //         database.raw(xyz)
            //     );
            // })
            .where({'exercises.slug': request.query.slug});

        // console.log(query.toSQL());

        query.then((rows) => {
            let exercise = rows[0];
            return reply(exercise);
        });
    }

    public getCourseNotes(request: Hapi.Request, reply: Hapi.IReply) {
        database('courses').select('notes').where('id', request.params.courseId).then(function (rows) {
            let notes = rows[0].notes;
            return reply({'notes': notes});
        });
    }

    public enrollInCourse(request: Hapi.Request, reply: Hapi.IReply) {
        database('course_enrolments').select('*')
            .where({
                'studentId': request.userId,
                'courseId': request.params.courseId
            })
            .then((rows) => {
                if (rows.length > 0) {
                    reply(Boom.expectationFailed('An enrolment against the user ID already exists.'));
                    return Promise.resolve({alreadyEnrolled: true});
                } else {
                    return Promise.resolve({alreadyEnrolled: false});
                }
            })
            .then((response) => {
                if (response.alreadyEnrolled === false) {
                    // database('batches').select('batches.id as batchId')
                    //     .where({'courseId': request.params.courseId})
                    //     .then((rows) => {
                    //         if (rows.length > 0) {
                    //             return Promise.resolve(rows[0]);
                    //         } else {
                    //             reply(Boom.expectationFailed('The course with the given Id doesn\'t exists' +
                    //                 'or there is no facilitator for the course'));
                    //         }
                    //     })
                    //     .then((batchId) => {
                    //         database('course_enrolments').insert({
                    //             studentId: request.userId,
                    //             courseId: request.params.courseId,
                    //             batchId: batchId['batchId']
                    //         }).then((response) => {
                    //             return reply({
                    //                 'enrolled': true,
                    //             });
                    //         });
                    //     });

                    database('courses')
                        .select('courses.id as courseId')
                        .where({
                            'courses.id':request.params.courseId
                        })
                        .then((rows) => {
                            if (rows.length > 0) {
                                return Promise.resolve(rows[0]);
                            } else {
                                reply(Boom.expectationFailed('The course for given id doesn\'t exists.'));
                            }
                        })
                        .then((courseId) => {
                            database('course_enrolments').insert({
                                studentId: request.userId,
                                courseId: courseId
                            })
                              .then((response) => {
                                return reply({
                                    'enrolled': true,
                                });
                              });
                        });
                }
            });
    }
    // Update all courses using default sequenceNum
    public updateCourseSequence(request: Hapi.Request, reply:Hapi.IReply){
      database('user_roles').select('user_roles.roles')
         .where({
             'userId': request.userId
         })
         .then((rows) => {
             if (rows[0].roles !== 'admin'){
               reply(Boom.expectationFailed('Admin are only allowed to change course sequence number.'));
               return Promise.resolve({isAdmin:false});
             } else {
               return Promise.resolve({isAdmin: true});
             }
         })
         .then((response) => {
             if(response.isAdmin === true){
                 let allCoursesUpdatePromises = [],
                     coursesData = request.payload.courses;
                 // TODO: check if any 2 values are repeated or not?

                 // Minimum 2 courses are required to change thier sequence number
                 if (coursesData.length > 1){
                     // iterate over each course data
                     for(let i = 0; i < coursesData.length; i++){
                       let courseUpdateQuery = database('courses')
                             .update({'sequenceNum': coursesData[i].sequenceNum})
                             .where({'id': coursesData[i].id})
                             .then( (count) => {
                                 // if any row is not updated
                                 if (count < 1){
                                     reply(Boom.expectationFailed(`No courses found for the given Id: ${coursesData[i].id}.`));
                                     return Promise.reject('Rejected');
                                 } else {
                                     return Promise.resolve();
                                 }
                             });
                       allCoursesUpdatePromises.push(courseUpdateQuery);
                     }
                     Promise.all(allCoursesUpdatePromises)
                         .then((results) => {
                             return Promise.resolve(true);
                         })
                         .catch((error) => {
                             return Promise.resolve(false);
                         })
                         .then((success) => {
                             if (success){
                                 return reply({
                                   "success": success
                                 });
                             }
                         });
                 } else {
                     return reply(Boom.expectationFailed("Minimum 2 courses are required to change thier sequence number."));
                 }

             }
         });
    }

    public deleteCourse(request: Hapi.Request, reply: Hapi.IReply){
        database('user_roles').select('roles')
          .where({
            'userId': request.userId
          })
          .then((rows) => {
            const isAdmin = rows[0].roles === 'admin' ? true : false;
            return Promise.resolve(isAdmin);
          })
          .then((isAdmin) => {
            // only admin are allowed to delete the courses
            if(isAdmin){
                const courseId = request.params.courseId;
                return database('courses').select('*')
                  .where({id:courseId})
                  .then((rows) => {
                    // if the course for given id doesn't exist
                    if (rows.length < 1){
                        reply(Boom.expectationFailed(`courseId: ${courseId} doesn't exists.`));
                        return Promise.reject("Rejected");
                    } else {
                        return Promise.resolve(rows[0]);
                    }
                  });
            } else {
                reply(Boom.expectationFailed('Only Admins are allowed to delete the courses.'));
                return Promise.reject("Rejected");
            }
          })
          .then((course) => {
              // delete all the enrollment of the course
              database('course_enrolments')
                    .where({courseId:course.id})
                    .delete()
                    .then(() => {
                      return Promise.resolve();
                    })
                    .then(() => {
                      // delete the batches of the course
                      return database('batches').where({courseId:course.id})
                          .delete()
                          .then(() => {
                            return Promise.resolve();
                          });
                    })
                    .then(() => {
                      // delete all the submissions for each of the exercises
                      // before deleting the exercises
                      return database('exercises').select('*')
                          .where({courseId:course.id})
                          .then((rows) => {
                            let allSubmissionDeleteQuery = [];
                            for(let i = 0; i < rows.length; i++){
                              let submissionDeleteQuery = database('submissions')
                                    .select('*')
                                    .where({exerciseId:rows[i].id})
                                    .delete();
                              allSubmissionDeleteQuery.push(submissionDeleteQuery);
                            };
                            return Promise.all(allSubmissionDeleteQuery)
                                .then(() => {
                                  return Promise.resolve();
                                });
                          })
                          .then(() => {
                            //after deleting the submissions delete the exercise
                            return database('exercises')
                                .where({courseId:course.id})
                                .delete()
                                .then(() => {
                                    return Promise.resolve();
                                });
                          });
                    })
                    .then(() => {
                      // after all that deleting delete the course
                      return database('courses').where({id:course.id})
                            .delete()
                            .then(() => {
                              return reply({
                                deleted:true
                              });
                            });
                    });
          });
      }

}
