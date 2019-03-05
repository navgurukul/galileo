import * as Boom from 'boom';
import * as Hapi from 'hapi';
import * as knex from 'knex';

import database from '../../';
import { getIsSolutionAvailable,listToTree,isStudentEligibleToEnroll } from '../../helpers/courseHelper';
import {manipulateResultSet} from '../../helpers/courseHelper';
import { IServerConfigurations } from '../../configurations/index';
import * as Configs from "../../configurations";
var _ = require('underscore');


export default class CourseController {

    private configs: IServerConfigurations;
    private database: any;
    private user: any;

    constructor(configs: IServerConfigurations, database: any) {
        this.database = database;
        this.configs = configs;
    }

    public getCoursesList(request, h) {
        return new Promise((resolve, reject) => {

            let courseConfig = Configs.getCourseConfigs();
            let totalExercisesPerCourse = [];
            let exerciseCompeletedPerCourse = [];
            let courseReliesOn=[];
            let courseReliesOnQ;
            let exerciseCompeletedPerCourseQ;
            let TotalExercisesPerCourseQ;
            let enrolledCourses = [],
                allAvailableCourses = [],
                completedCourses = [];

            let enrolledQ, availableQ, completedQ;

            if (request.headers.authorization === undefined) {
                availableQ =
                    database('courses')
                        .select(
                            'courses.id', 'courses.name', 'courses.type',
                            'courses.logo', 'courses.shortDescription',
                            'courses.sequenceNum'
                        )
                        .then((rows) => {
                            allAvailableCourses = rows;
                            return Promise.resolve();
                        });

                availableQ.then(() => {
                    resolve({
                        'availableCourses': allAvailableCourses
                    });
                });

            } else if (request.headers.authorization !== "") {
                enrolledQ =
                    database('course_enrolments')
                        .select(
                            'courses.id', 'courses.name', 'courses.type',
                            'courses.logo', 'courses.daysToComplete',
                            'courses.shortDescription', 'courses.sequenceNum',
                            database.raw('MIN(course_enrolments.enrolledAt) as enrolledAt'),
                            database.raw('COUNT(CASE WHEN exercises.submissionType IS NOT NULL THEN 1 END) as totalExercises'),
                            database.raw('COUNT(DISTINCT submissions.id) as completedSubmissions')
                        )
                        .innerJoin('courses', 'course_enrolments.courseId', '=', 'courses.id')
                        .innerJoin('exercises', function () {
                            // count only those exercises which have submissionType != null
                            this.on('course_enrolments.courseId', '=', 'exercises.courseId');
                        })
                        .leftJoin('submissions', function () {
                            this.on('submissions.userId', '=', request.userId)
                                .andOn('submissions.exerciseId', '=', 'exercises.id')
                                .andOn('submissions.completed', '=', 1);
                        })
                        .where({
                            'course_enrolments.studentId': request.userId,
                            'course_enrolments.courseStatus': 'enroll',
                        })
                        .groupBy('exercises.courseId')
                        .then((rows) => {
                            enrolledCourses = rows;
                            let lastSubmissionQueries = [];
                            for (let i = 0; i < enrolledCourses.length; i++) {
                                let oneDay = 24 * 60 * 60 * 1000;
                                enrolledCourses[i].daysSinceEnrolled =
                                    Math.abs(+new Date() - enrolledCourses[i].enrolledAt) / oneDay;

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
                            return Promise.all(lastSubmissionQueries);
                        });
                completedQ =
                    database('course_enrolments')
                        .select(
                            'courses.id', 'courses.name', 'courses.type', 'courses.logo', 'courses.daysToComplete',
                            'courses.shortDescription', 'courses.sequenceNum',
                            'course_enrolments.completedAt', 'course_enrolments.enrolledAt',
                        )
                        .innerJoin('courses', 'courses.id', 'course_enrolments.courseId')
                        .where({ 'course_enrolments.courseStatus': 'completed' })
                        .then((rows) => {
                            completedCourses = rows;
                        });
                
                /* **get the list of courses that the user is not already enrolled in** */        
                availableQ =
                    database('courses')
                        .select('courses.id', 'courses.name', 'courses.type',
                            'courses.logo', 'courses.shortDescription', 'courses.sequenceNum')
                        .where('courses.id', 'not in', database('courses').distinct()
                            .select('courses.id')
                            .join('course_enrolments', function () {
                                this.on('courses.id', '=', 'course_enrolments.courseId')
                                    .andOn('course_enrolments.studentId', '=', request.userId);
                            })
                        )
                        .then((rows) => {
                            allAvailableCourses = rows;
                            return Promise.resolve();
                        });

                  /* **get the list of exercises available in each course** */              
                        TotalExercisesPerCourseQ = database('exercises')
                        .select( 'exercises.courseId',
                        database.raw('COUNT(exercises.id) as totalExercises')).groupBy('exercises.courseId')
                        .then((rows) => {
                            totalExercisesPerCourse = rows;
                            return Promise.resolve();
                        });
                    
                  /* **get the exercises completed in each course by the given user ** */      
                        exerciseCompeletedPerCourseQ =
                        database('exercises')
                            .select(database.raw('COUNT(exercises.id) as totalExercisesCompleted'), 
                            'exercises.courseId')
                            .where('exercises.id', 'in', database('submissions') 
                            .select('submissions.exerciseId').where({'submissions.completed':1})// ****change this with the enum value*****// 
                            .andWhere('submissions.userId', '=', 9) //******replace 9 with request.userId*****//
                            ).groupBy('exercises.courseId')
                            .then((rows) => {
                                exerciseCompeletedPerCourse = rows;
                                return Promise.resolve();
                            });
                            
                    /* **get the course dependeny list ** */              
                            courseReliesOnQ =
                            database('course_relation')
                                .select(
                                'course_relation.courseId', 'course_relation.reliesOn'
                                )
                                .then((rows) => {
                                    courseReliesOn = rows;
                                    return Promise.resolve();
                                });

                /* ** Perform operations on the data received above to filter the courses that the user 
                is not eligible to watch in the code block below  ** */
                //console.log('outside promise allllllllllll');
                Promise.all([enrolledQ, availableQ, completedQ,exerciseCompeletedPerCourseQ, TotalExercisesPerCourseQ, courseReliesOnQ]).then(() => {
                    let availableCourses = manipulateResultSet(totalExercisesPerCourse,exerciseCompeletedPerCourse, courseReliesOn,
                        allAvailableCourses, courseConfig.courseCompleteionCriteria);
                    resolve({
                        enrolledCourses,
                        availableCourses,
                        completedCourses
                    });
                });

            }
        });
    }   
    
    public getCourseTopics(request, h) {
        return new Promise((resolve, reject) => {
            let exercises = [];
            let courseId = parseInt(request.params.courseId, 10);

            let query = database('exercises')
                .select('exercises.id', 'exercises.name')
                .where({ "exercises.courseId": courseId })
                .andWhere({ "exercises.parentExerciseId": null })
                .orderBy("exercises.sequenceNum", "asc");

            query.then((rows) => {
                resolve({ data: rows });
            });
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

    public getCourseExercises(request, h) {
        return new Promise((resolve, reject) => {
            let exercises = [], query;
            if (request.headers.authorization === undefined) {
                query = database('exercises')
                    .select('exercises.id', 'exercises.parentExerciseId', 'exercises.name', 'exercises.slug', 'exercises.sequenceNum',
                        'exercises.reviewType', 'exercises.githubLink', 'exercises.submissionType')
                    .where({ 'exercises.courseId': request.params.courseId })
                    .orderBy('exercises.sequenceNum', 'asc');

            } else {
                let xyz = '(SELECT max(submissions.id) FROM submissions WHERE exerciseId = exercises.id '
                    + 'AND userId = ' + request.userId + ' ORDER BY state ASC LIMIT 1)';
                query = database('exercises')
                    .select('exercises.id', 'exercises.parentExerciseId', 'exercises.name', 'exercises.slug', 'exercises.sequenceNum',
                        'exercises.reviewType', 'exercises.githubLink', 'exercises.submissionType',
                        'submissions.state as submissionState', 'submissions.id as submissionId',
                        'submissions.completedAt as submissionCompleteAt', 'submissions.userId')
                    .leftJoin('submissions', function () {
                        this.on('submissions.id', '=',
                            knex.raw(xyz)
                        ).on('submissions.userId', '=', request.userId);
                    })
                    .where({ 'exercises.courseId': request.params.courseId })
                    .orderBy('exercises.sequenceNum', 'asc');
            }



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
                        if (parseInt(exercise.sequenceNum, 10) % 100 > 0) {
                            let parentIndex = Math.floor(parseInt(exercise.sequenceNum, 10) / 1000 - 1);
                            exercises[parentIndex].childExercises.push(exercise);
                        } else {
                            exercise.childExercises = [];
                            exercises.push(exercise);
                        }
                    }
                }
                resolve({ data: exercises });
            });
        });
    }

    public getExerciseById(request, h) {
        return new Promise((resolve, reject) => {
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
                .where({ 'exercises.id': request.params.exerciseId })
                .then((rows) => {
                    let exercise = rows[0];
                    resolve(exercise);
                });
        });
    }

    public getSolutionByExerciseId(request, h) {
        return new Promise((resolve, reject) => {
            database('exercises')
                .select('exercises.solution')
                .where({ 'exercises.id': request.params.exerciseId })
                .then((rows) => {
                    resolve(rows);
                });
        });
    }

    public getExerciseBySlug(request, h) {
        return new Promise((resolve, reject) => {
            let exerciseQuery;
            if (request.headers.authorization === undefined) {
                exerciseQuery = database('exercises')
                    .select(
                        'exercises.id', 'exercises.parentExerciseId',
                        'exercises.name', 'exercises.slug', 'exercises.sequenceNum',
                        'exercises.reviewType', 'exercises.solution', 'exercises.content',
                        'exercises.submissionType', 'exercises.githubLink'
                    )
                    .where({ 'exercises.slug': request.query.slug });
                exerciseQuery.then((rows) => {
                    resolve(rows[0]);
                });
            } else {
                let xyz = '(SELECT max(submissions.id) FROM submissions WHERE exerciseId = exercises.id ' +
                    'AND userId = ' + request.userId + '  ORDER BY state ASC LIMIT 1)';

                exerciseQuery = database('exercises')
                    .select('exercises.id', 'exercises.parentExerciseId', 'exercises.name', 'exercises.slug', 'exercises.sequenceNum',
                        'exercises.reviewType', 'exercises.solution', 'exercises.content', 'exercises.submissionType',
                        'exercises.githubLink',
                        'submissions.state as submissionState', 'submissions.id as submissionId',
                        'submissions.completedAt as submissionCompleteAt')
                    .leftJoin('submissions', function () {
                        this.on('submissions.id', '=',
                            database.raw(xyz)
                        );
                    })
                    .where({ 'exercises.slug': request.query.slug });

                database('users')
                    .select('users.center')
                    .where({ 'users.id': request.userId })
                    .then((rows) => {
                        let usersCompletedExerciseQuery =
                            database('users')
                                .select('users.id', 'users.name')
                                .innerJoin('submissions', 'submissions.userId', '=', 'users.id')
                                .innerJoin('exercises', function () {
                                    this.on('exercises.id', '=', 'submissions.exerciseId');
                                })
                                .where({
                                    'exercises.slug': request.query.slug,
                                    // only those names who have completed the exercise
                                    'submissions.completed': 1,
                                    'submissions.state': 'completed',
                                    // first priority to student from same center
                                    'users.center': rows[0].center,
                                });

                        // select user from submission of same exercise

                        Promise.all([usersCompletedExerciseQuery, exerciseQuery]).then((queries) => {
                            let exercise, usersCompletedExercise, isSolutionAvailable;
                            exercise = queries[1][0];
                            isSolutionAvailable = getIsSolutionAvailable(exercise);
                            usersCompletedExercise = queries[0];

                            let response = {
                                ...exercise,
                                usersCompletedExercise: usersCompletedExercise,
                                ifSolution: isSolutionAvailable
                            };
                            resolve(response);
                        });
                    });
            }
        });
    }

    public getCourseNotes(request, reply) {
        return new Promise((resolve, reject) => {
            database('courses').select('notes').where('id', request.params.courseId).then(function (rows) {
                let notes = rows[0].notes;
                resolve({ 'notes': notes });
            });
        });
    }

    public enrollInCourse(request, h) {
        return new Promise((resolve, reject) => {
            database('course_enrolments').select('*')
                .where({
                    'studentId': request.userId,
                    'courseId': request.params.courseId
                })
                .then((rows) => {
                    if (rows.length > 0) {
                        reject(Boom.expectationFailed('An enrolment against the user ID already exists.'));
                        return Promise.resolve({ alreadyEnrolled: true });
                    } else {
                        return Promise.resolve({ alreadyEnrolled: false });
                    }
                })
                .then((response) => {
                    if (response.alreadyEnrolled === false) {
                        isStudentEligibleToEnroll(request.userId, request.params.courseId).then((isStudentEligible) => {
                            if(isStudentEligible) {
                                database('courses')
                                .select('courses.id as courseId')
                                .where({
                                    'courses.id':request.params.courseId
                                })
                                .then((rows) => {
                                    if (rows.length > 0) {
                                        return Promise.resolve(rows[0]);
                                    } else {
                                        reject(Boom.expectationFailed('The course for given id doesn\'t exists.'));
                                    }
                                })
                                .then(({courseId}) => {
                                    database('course_enrolments').insert({
                                        studentId: request.userId,
                                        courseId: courseId
                                    })
                                      .then((response) => {
                                        resolve({
                                            'enrolled': true,
                                        });
                                      });
                                });
                            } else {
                                reject(Boom.expectationFailed('student has not met the completion threshold for the dependent courses'));
                            }
                        });
                    }
                });
        });
    }
    // public enrollInCourse(request, h) {
    //     //console.log('###########################');
    //     //this.isStudentEligibleToEnroll(request.userId, request.params.courseId);
    //     //return;
    //     return new Promise((resolve, reject) => {

    //         database('course_enrolments').select('*')
    //             .where({
    //                 'studentId': request.userId,
    //                 'courseId': request.params.courseId
    //             })
    //             .then((rows) => {
    //                 if (rows.length > 0) {
    //                     reject(Boom.expectationFailed('An enrolment against the user ID already exists.'));
    //                     return Promise.resolve({alreadyEnrolled: true});
    //                 } else {
    //                     return Promise.resolve({alreadyEnrolled: false});
    //                 }
    //             })
    //             .then((response) => {
    //                 if (response.alreadyEnrolled === false) {
    //                     // if(this.isStudentEligibleToEnroll(request.userId, request.params.courseId)) {
    //                     //     console.log('aaaaaa');
    //                     //     return Promise.resolve({studentCanBeEnrolled: true});
    //                     // } else {
    //                     //     console.log('bbbbbbbbbbbb');
    //                     //     reject(Boom.expectationFailed('the course does not atistfy dependency'));
    //                     // }
    //                     this.isStudentEligibleToEnroll(request.userId, request.params.courseId).then((data) => {
    //                         console.log('data');
    //                         console.log(data);
    //                     });
    //                 }
    //             })
    //             .then((response) => {
    //                 if (response.alreadyEnrolled === true) {
    //                     database('courses')
    //                         .select('courses.id as courseId')
    //                         .where({
    //                             'courses.id':request.params.courseId
    //                         })
    //                         .then((rows) => {
    //                             if (rows.length > 0) {
    //                                 return Promise.resolve(rows[0]);
    //                             } else {
    //                                 reject(Boom.expectationFailed('The course for given id doesn\'t exists.'));
    //                             }
    //                         })
    //                         .then(({courseId}) => {
    //                             database('course_enrolments').insert({
    //                                 studentId: request.userId,
    //                                 courseId: courseId
    //                             })
    //                               .then((response) => {
    //                                 resolve({
    //                                     'enrolled': true,
    //                                 });
    //                               });
    //                         });
    //                 }
    //             });
    //     });
    // } 
 
    // Update all courses using default sequenceNum
    public updateCourseSequence(request, h) {
        return new Promise((resolve, reject) => {

            database('user_roles').select('user_roles.roles')
                .where({
                    'userId': request.userId
                })
                .then((rows) => {
                    if (rows[0].roles !== 'admin') {
                        reject(Boom.expectationFailed('Admin are only allowed to change course sequence number.'));
                        return Promise.resolve({ isAdmin: false });
                    } else {
                        return Promise.resolve({ isAdmin: true });
                    }
                })
                .then((response) => {
                    if (response.isAdmin === true) {
                        let allCoursesUpdatePromises = [],
                            coursesData = request.payload.courses;
                        // TODO: check if any 2 values are repeated or not?

                        // Minimum 2 courses are required to change thier sequence number
                        if (coursesData.length > 1) {
                            // iterate over each course data
                            for (let i = 0; i < coursesData.length; i++) {
                                let courseUpdateQuery = database('courses')
                                    .update({ 'sequenceNum': coursesData[i].sequenceNum })
                                    .where({ 'id': coursesData[i].id })
                                    .then((count) => {
                                        // if any row is not updated
                                        if (count < 1) {
                                            reject(Boom.expectationFailed(`No courses found for the given Id: ${coursesData[i].id}.`));
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
                                    if (success) {
                                        resolve({
                                            "success": success
                                        });
                                    }
                                });
                        } else {
                            reject(Boom.expectationFailed("Minimum 2 courses are required "
                                + "to change their sequence number."));
                        }

                    }
                });
        });
    }

    public deleteCourse(request, h) {
        return new Promise((resolve, reject) => {
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
                    if (isAdmin) {
                        const courseId = request.params.courseId;
                        return database('courses').select('*')
                            .where({ id: courseId })
                            .then((rows) => {
                                // if the course for given id doesn't exist
                                if (rows.length < 1) {
                                    reject(Boom.expectationFailed(`courseId: ${courseId} doesn't exists.`));
                                    return Promise.reject("Rejected");
                                } else {
                                    return Promise.resolve(rows[0]);
                                }
                            });
                    } else {
                        reject(Boom.expectationFailed('Only Admins are allowed to delete the courses.'));
                        return Promise.reject("Rejected");
                    }
                })
                .then((course) => {
                    // delete all the enrollment of the course
                    return database('course_enrolments')
                        .where({ courseId: course.id }).delete()
                        .then(() => {
                            return Promise.resolve(course);
                        });

                })
                .then((course) => {
                    // delete all the submissions for each of the exercises
                    // before deleting the exercises
                    return database('exercises').select('*')
                        .where({ courseId: course.id })
                        .then((rows) => {
                            let allSubmissionDeleteQuery = [];
                            for (let i = 0; i < rows.length; i++) {
                                let submissionDeleteQuery =
                                    database('submissions')
                                        .select('*')
                                        .where({ exerciseId: rows[i].id })
                                        .delete();

                                allSubmissionDeleteQuery.push(submissionDeleteQuery);
                            };
                            return Promise.all(allSubmissionDeleteQuery).then(() => {
                                return Promise.resolve(course);
                            });
                        });
                })
                .then((course) => {
                    //after deleting the submissions delete the exercise
                    return database('exercises')
                        .where({ courseId: course.id }).delete()
                        .then(() => {
                            return Promise.resolve(course);
                        });
                })
                .then((course) => {
                    // after all that deleting delete the course
                    database('courses')
                        .where({ id: course.id }).delete()
                        .then(() => {
                            resolve({
                                deleted: true
                            });
                        });
                });
        });
    }

    public courseComplete(request, h) {
        // only facilitator of the mentee center or
        // mentor of the mentee can mark the course complete
        // request.userId = 1;
        return new Promise((resolve, reject) => {
            // check if the student id exist or not.
            database('users')
                .select('*')
                .where({
                    'users.id': request.payload.menteeId
                })
                .then((rows) => {
                    if (rows.length < 1) {
                        reject(Boom.expectationFailed("The menteeId is "
                            + "invalid no student exist with the given menteeId."));
                        return Promise.reject("Rejected");
                    } else {
                        return Promise.resolve(rows[0]);
                    }
                })
                .then((mentee) => {
                    // check if the is the mentor for the menteeId?
                    return database('mentors')
                        .select('*')
                        .where({
                            'mentors.mentor': request.userId,
                            'mentors.mentee': mentee.id,
                        })
                        .then((rows) => {
                            if (rows.length < 1) {
                                return Promise.resolve({ isMentor: false, mentee });
                            } else {
                                return Promise.resolve({ isMentor: true, mentee });
                            }
                        });
                })
                .then((response) => {
                    if (!response.isMentor) {
                        const { mentee } = response;
                        // check if he is the facilitator for the menteeId center?
                        return database('user_roles').select('*')
                            .where({
                                'user_roles.userId': request.userId,
                                'user_roles.roles': 'facilitator',
                                'user_roles.center': mentee.center,
                            })
                            .orWhere({
                                'user_roles.userId': request.userId,
                                'user_roles.roles': 'facilitator',
                                'user_roles.center': 'all',
                            })
                            .then((rows) => {
                                let message = "You are not the facilitator for the given mentee's center"
                                    + " or the mentor for the given menteeId.";
                                if (rows.length < 1) {
                                    reject(Boom.expectationFailed(message));
                                    return Promise.reject("Rejected");
                                } else {
                                    return Promise.resolve();
                                }
                            });
                    } else {
                        // proceed if he user is the mentor of th givem menteeId.
                        return Promise.resolve();
                    }
                })
                .then(() => {
                    // check if the course exist or not.
                    return database('courses').select('*')
                        .where({ 'courses.id': request.params.courseId })
                        .then((rows) => {
                            if (rows.length < 1) {
                                reject(Boom.expectationFailed("The course id doesn't exist."));
                                return Promise.reject("Rejected");
                            } else {
                                return Promise.resolve();
                            }
                        });
                })
                .then(() => {
                    // check if the student have enrolled in the course.
                    return database('course_enrolments').select('*')
                        .where({
                            'course_enrolments.studentId': request.payload.menteeId,
                            'course_enrolments.courseId': request.params.courseId,
                        })
                        .then((rows) => {
                            if (rows.length < 1) {
                                reject(Boom.expectationFailed("The student is not enrolled in the course."));
                                return Promise.reject("Rejected");
                            } else if (rows[0].courseStatus === 'completed') {
                                reject(Boom.expectationFailed("The student have already "
                                    + "completed the course."));
                                return Promise.reject("Rejected");
                            }
                            else {
                                return Promise.resolve();
                            }
                        });
                })
                .then(() => {
                    // mark the course complete here.
                    database('course_enrolments')
                        .update({
                            'course_enrolments.courseStatus': 'completed',
                            'course_enrolments.completedAt': new Date(),
                        })
                        .where({
                            'course_enrolments.studentId': request.payload.menteeId,
                            'course_enrolments.courseId': request.params.courseId,
                        })
                        .then((rows) => {
                            resolve({
                                'success': true
                            });
                        });

                });

        });
    }


    public getCourseRelationList(request, h) {
        return new Promise((resolve, reject) => {
            let query = database('course_relation').select('*');

            query.then((rows) => {
                if (rows.length > 0) {
                    resolve({ data: rows });
                } else {
                    reject(Boom.expectationFailed('Not added any course dependencies for the courses....'));
                }
            });
        });
    }

    public deleteCourseRelation(request, h) {
        return new Promise((resolve, reject) => {
            database('course_relation').select('*')
                .where({
                    'courseId': request.params.courseId,
                    'reliesOn': request.params.reliesOn
                })
                .then((rows) => {
                    if (rows.length > 0) {
                        database('course_relation')
                            .where({
                                'courseId': request.params.courseId,
                                'reliesOn': request.params.reliesOn
                            }).delete()
                            .then(() => {
                                resolve({
                                    deleted: true
                                });
                            });
                    } else {
                        reject(Boom.expectationFailed('Course Dependency to the corresponding course id does not exists.'));

                    }
                });
        });
    }

    public addCourseRelation(request, h) {
        return new Promise((resolve, reject) => {
            database('user_roles').select('roles')
                .where({
                    'userId': request.userId
                })
                .then((rows) => {
                    const isAdmin = rows[0].roles === 'admin' ? true : false;
                    return Promise.resolve(isAdmin);
                })
                .then((isAdmin) => {
                    // only admin are allowed to add the courses
                    if (isAdmin) {
                        database('course_relation').select('*')
                            .where({
                                'courseId': request.params.courseId,
                                'reliesOn': request.params.reliesOn
                            })
                            .then((rows) => {
                                if (rows.length > 0) {
                                    reject(Boom.expectationFailed('Course Dependency to the corresponding course id already exists.'));
                                    return Promise.resolve({ alreadyAddedCourseDependency: true });
                                } else {
                                    return Promise.resolve({ alreadyAddedCourseDependency: false });
                                }
                            })
                            .then((response) => {
                                if (response.alreadyAddedCourseDependency === false) {
                                    database('course_relation')
                                        .insert({
                                            courseId: request.params.courseId,
                                            reliesOn: request.params.reliesOn
                                        })
                                        .then((response) => {
                                            resolve({
                                                'Added': true,
                                            });
                                        });
                                }
                            });
                    } else {
                        reject(Boom.expectationFailed('Only Admins are allowed to add the course dependencies.'));
                        return Promise.reject("Rejected");
                    }
                });
        });
    }

    public getStudentsWithoutMentorList(request, h) {


        return new Promise((resolve, reject) => {
            database('users')
                .select('users.id', 'users.center', 'users.name', 'users.email', 'user_roles.roles')

                .innerJoin('user_roles', 'user_roles.userId', 'users.id')
                .leftJoin('mentors', 'user_roles.userId', 'mentors.mentee')
                .where({
                    'user_roles.roles': 3,

                })
                .andWhere(function () {

                    if (request.query.centerId && request.query.centerId.length > 0)
                        this.where({ 'users.center': request.query.centerId })
                })
                .whereNull('mentee').then((rows) => {

                    if (rows.length < 1) {
                        reject(Boom.expectationFailed("No student exist with out mentor."));

                    } else {
                      //  console.log(rows);
                        resolve({ data: rows });

                    }

                });

        });
    }

    public getStudentsWithMentorList(request, h) {


        return new Promise((resolve, reject) => {
            database('users')
                .select('users.id', 'users.name', 'users.center', 'users.email', 'user_roles.roles', 'mentors.mentor')

                .innerJoin('user_roles', 'user_roles.userId', 'users.id')
                .leftJoin('mentors', 'user_roles.userId', 'mentors.mentee')
                .where({
                    'user_roles.roles': 3,
                    'mentors.mentor': request.params.mentorId
                })

                .andWhere(function () {

                    if (request.query.centerId && request.query.centerId.length > 0)
                        this.where({ 'users.center': request.query.centerId })
                }).then((rows) => {

                    if (rows.length < 1) {
                        reject(Boom.expectationFailed("No student exist with this mentor."));

                    } else {

                        resolve({ data: rows });

                    }

                });

        });
    }

  

    public getMentorsOrMenteesList(request, h) {


        return new Promise((resolve, reject) => {

            let mentorListResult = [],
                menteeListResult = [];

            // get the all mentore list 

            let mentorList = database('users')
                .select('mentors.mentee as menteeId', 'mentors.mentor as mentorId','users.name', 'users.center', 'users.email', 'user_roles.roles')

                .innerJoin('user_roles', 'user_roles.userId', 'users.id')
                .rightJoin('mentors', 'user_roles.userId', 'mentors.mentor')
                // .where({
                //     'user_roles.roles': 2,

                // })

                .andWhere(function () {

                    if (request.query.centerId && request.query.centerId.length > 0)
                        this.where({ 'users.center': request.query.centerId })
                }).orderBy('mentors.mentor')
               
                .then((rows) => {

                    if (rows.length < 1) {
                        reject(Boom.expectationFailed("No mentor is present for this center."));

                    } else {
                        //  console.log(rows);

                        
                        mentorListResult =listToTree(rows);
                        resolve(mentorListResult);
                    }

                });

           


        });
    }


    public deleteMentorMentee(request, h) {
        return new Promise((resolve, reject) => {

            request.userId = 28; // for the time being we have initialize

            database('user_roles').select('roles')
                .where({
                    'userId': request.userId
                }).then((rows) => {

                    const isAdmin = (rows.length > 0 && rows[0].roles === 'admin') ? true : false;

                    return Promise.resolve(isAdmin);
                })
                .then((isAdmin) => {


                    // only admin are allowed to delete the courses
                    if (isAdmin) {
                        const mentorId = request.params.mentorId;
                        const menteeId = request.params.menteeId;
                        let mentorExist = false, menteeExist = false;

                        let mentor = database('mentors').select('*')
                            .where({
                                'mentor': mentorId,

                            }).then((rows) => {
                                if (rows.length < 1) {
                                    // reject(Boom.expectationFailed(` This mentor doesn't exists.`));
                                    //return Promise.reject("Rejected");

                                    return Promise.resolve(mentorExist);
                                } else {

                                    mentorExist = true;
                                    return Promise.resolve(mentorExist);
                                }
                            });

                        let mentee = database('mentors').select('*')
                            .where({
                                'mentee': menteeId

                            }).then((rows) => {
                                if (rows.length < 1) {
                                    //  reject(Boom.expectationFailed(` This mentee doesn't exists.`));
                                    //return Promise.reject("Rejected");

                                    return Promise.resolve(menteeExist);
                                } else {

                                    menteeExist = true;
                                    return Promise.resolve(menteeExist);

                                }
                            });

                        Promise.all([mentor, mentee]).then(() => {

                            if (mentorExist && menteeExist) {

                                console.log(mentorExist, menteeExist);

                                return database('mentors').select('*')
                                    .where({
                                        'mentor': mentorId,
                                        'mentee': menteeId,
                                    })
                                    .then((rows) => {

                                        // if the course for given id doesn't exist

                                        if (rows.length < 1) {
                                            reject(Boom.expectationFailed(` The mentorId  is not the mentor of the menteeId.`));
                                            return Promise.reject("Rejected");
                                        } else {
                                            return Promise.resolve(rows[0]);
                                        }
                                    });



                            } else if (mentorExist && !menteeExist) {
                                reject(Boom.expectationFailed(` The menteeId doesn't have any mentor.`));
                                return Promise.reject("Rejected");


                            } else if (!mentorExist && menteeExist) {
                                reject(Boom.expectationFailed(` The mentorId is not a mentor.`));
                                return Promise.reject("Rejected");


                            } else {
                                reject(Boom.expectationFailed(` MentorId and menteeId both doesn't exist in the platform.`));
                                return Promise.reject("Rejected");
                            }

                        }).then((mentors) => {


                            // after all that deleting delete the course
                            database('mentors')
                                .where({ id: mentors.id }).delete()
                                .then(() => {
                                    resolve({
                                        deleted: true
                                    });
                                });
                        });




                    } else {
                        reject(Boom.expectationFailed('Only Admins are allowed to delete the mentors and mentee.'));
                        return Promise.reject("Rejected");
                    }
                })

        });
    }

    public deleteMentorMenteeByidOrEmail(request, h) {

        return new Promise((resolve, reject) => {

            request.userId = 28; // for the time being we have initialize


            database('user_roles').select('roles')
                .where({
                    'userId': request.userId
                }).then((rows) => {

                    const isAdmin = (rows.length > 0 && rows[0].roles === 'admin') ? true : false;

                    return Promise.resolve(isAdmin);
                }).then((isAdmin) => {

                    // only admin are allowed to delete the courses
                    if (isAdmin) {

                        const mentorId = request.payload.mentorId;
                        const menteeId = request.payload.menteeId;
                        const mentorEmail = request.payload.mentorEmail;

                        console.log(mentorId, menteeId, mentorEmail);


                        return database('mentors').select('mentors.id as mentorsId', 'users.id as userID')
                            .innerJoin('users', 'users.id', 'mentors.mentor')
                            .where({

                                'mentors.mentee': menteeId
                            }).andWhere(function () {

                                if (mentorId !== undefined)
                                    this.where({ 'mentors.mentor': mentorId })
                            }).andWhere(function () {

                                if (mentorEmail !== undefined)
                                    this.where({ 'users.email': mentorEmail })
                            }).then((rows) => {
                                // if the course for given id doesn't exist
                                if (rows.length < 1) {
                                    reject(Boom.expectationFailed(`This record doesn't exists.`));
                                    return Promise.reject("Rejected");
                                } else {


                                    return Promise.resolve(rows[0]);
                                }
                            });
                    } else {
                        reject(Boom.expectationFailed('Only Admins are allowed to delete the mentors and mentee.'));
                        return Promise.reject("Rejected");
                    }
                }).then((mentors) => {

                    // after all that deleting delete the course
                    database('mentors')
                        .where({ id: mentors.mentorsId }).delete()
                        .then(() => {
                            resolve({
                                deleted: true
                            });
                        });
                });
        });
    }

}




