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

    public getCoursesList(request, h) {
        return new Promise((resolve, reject) => {
            let enrolledCourses = [],
                availableCourses = [],
                completedCourses = [];

            let enrolledQ, availableQ, completedQ;

            if (request.headers.authorization === undefined ){
                availableQ =
                    database('courses').select('courses.id', 'courses.name', 'courses.type',
                        'courses.logo', 'courses.shortDescription', 'courses.sequenceNum')
                        .then((rows) => {
                            availableCourses = rows;
                            return Promise.resolve();
                        });

                availableQ.then(() => {
                    resolve({
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
                            database.raw('COUNT(CASE WHEN exercises.submissionType IS NOT NULL THEN 1 END) as totalExercises'),
                            database.raw('COUNT(DISTINCT submissions.id) as completedSubmissions'))
                        .innerJoin('courses', 'course_enrolments.courseId', '=', 'courses.id')
                        .innerJoin('exercises', function(){
                            // count only those exercises which have submissionType != null
                            this.on('course_enrolments.courseId', '=', 'exercises.courseId')
                        })
                        .leftJoin('submissions', function () {
                            this.on('submissions.userId', '=', request.userId)
                                .andOn('submissions.exerciseId', '=', 'exercises.id')
                                .andOn('submissions.completed', '=', 1);
                        })
                        .where({
                            'course_enrolments.studentId': request.userId,
                            'course_enrolments.courseStatus':'enroll',
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
                            'courses.id', 'courses.name', 'courses.type','courses.logo', 'courses.daysToComplete',
                            'courses.shortDescription', 'courses.sequenceNum','course_enrolments.completedAt', 'course_enrolments.enrolledAt',
                        )
                        .innerJoin('courses', 'courses.id', 'course_enrolments.courseId')
                        .where({'course_enrolments.courseStatus': 'completed'})
                        .then((rows) => {
                            completedCourses = rows;
                        });

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
                        .then((rows) => {
                            availableCourses = rows;
                            return Promise.resolve();
                        });

                Promise.all([enrolledQ, availableQ, completedQ]).then(() => {
                    resolve({
                        enrolledCourses,
                        availableCourses,
                        completedCourses,
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
                            .where({"exercises.courseId": courseId})
                            .andWhere({"exercises.parentExerciseId": null})
                            .orderBy("exercises.sequenceNum", "asc");

            query.then((rows) => {
                resolve({data: rows});
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
            if (request.headers.authorization === undefined){
                query = database('exercises')
                    .select('exercises.id', 'exercises.parentExerciseId', 'exercises.name', 'exercises.slug', 'exercises.sequenceNum',
                        'exercises.reviewType', 'exercises.githubLink', 'exercises.submissionType')
                    .where({'exercises.courseId': request.params.courseId})
                    .orderBy('exercises.sequenceNum', 'asc');

            } else{
                let xyz = '(SELECT max(submissions.id) FROM submissions WHERE exerciseId = exercises.id '
                    + 'AND userId = ' + request.userId + ' ORDER BY state ASC LIMIT 1)';
                query = database('exercises')
                    .select('exercises.id', 'exercises.parentExerciseId', 'exercises.name', 'exercises.slug', 'exercises.sequenceNum',
                            'exercises.reviewType', 'exercises.githubLink', 'exercises.submissionType',
                            'submissions.state as submissionState','submissions.id as submissionId',
                            'submissions.completedAt as submissionCompleteAt', 'submissions.userId')
                    .leftJoin('submissions', function () {
                        this.on('submissions.id', '=',
                            knex.raw(xyz)
                        ).on('submissions.userId', '=', request.userId);
                    })
                    .where({'exercises.courseId': request.params.courseId})
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
                        if (parseInt(exercise.sequenceNum, 10) %100 > 0) {
                            let parentIndex = Math.floor( parseInt(exercise.sequenceNum, 10) / 1000 - 1);
                                exercises[parentIndex].childExercises.push(exercise);
                            } else {
                            exercise.childExercises = [];
                            exercises.push(exercise);
                            }
                        }
                }
                resolve({data: exercises});
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
                .where({'exercises.id': request.params.exerciseId})
                .then((rows) => {
                    let exercise = rows[0];
                    resolve(exercise);
                });
        });
    }

    public getExerciseBySlug(request, h) {
        return new Promise((resolve, reject) => {
            let exerciseQuery;
            if (request.headers.authorization === undefined){
                exerciseQuery = database('exercises')
                    .select(
                        'exercises.id', 'exercises.parentExerciseId', 
                        'exercises.name', 'exercises.slug', 'exercises.sequenceNum',
                        'exercises.reviewType', 'exercises.content', 
                        'exercises.submissionType', 'exercises.githubLink'
                    )
                    .where({'exercises.slug': request.query.slug});
                exerciseQuery.then((rows) => {
                    resolve(rows[0]);
                });
            } else {
                let xyz = '(SELECT max(submissions.id) FROM submissions WHERE exerciseId = exercises.id ' +
                    'AND userId = ' + request.userId + '  ORDER BY state ASC LIMIT 1)';

                exerciseQuery = database('exercises')
                    .select('exercises.id', 'exercises.parentExerciseId', 'exercises.name', 'exercises.slug', 'exercises.sequenceNum',
                        'exercises.reviewType', 'exercises.content', 'exercises.submissionType', 'exercises.githubLink',
                        'submissions.state as submissionState', 'submissions.id as submissionId',
                        'submissions.completedAt as submissionCompleteAt')
                    .leftJoin('submissions', function () {
                        this.on('submissions.id', '=',
                            database.raw(xyz)
                        );
                    })
                    .where({'exercises.slug': request.query.slug});

                database('users')
                    .select('users.center')
                    .where({'users.id': request.userId})
                    .then((rows) => {
                        let usersCompletedExerciseQuery = 
                                database('users')
                                    .select('users.id', 'users.name')
                                    .innerJoin('submissions', 'submissions.userId', '=', 'users.id')
                                    .innerJoin('exercises', function (){
                                        this.on('exercises.id', '=', 'submissions.exerciseId');
                                    })
                                    .where({
                                        'exercises.slug':request.query.slug,
                                        // only those names who have completed the exercise
                                        'submissions.completed':1,
                                        'submissions.state':'completed',
                                        // first priority to student from same center
                                        'users.center':rows[0].center,
                                    });

                        // select user from submission of same exercise

                        Promise.all([usersCompletedExerciseQuery, exerciseQuery]).then((queries) => {
                            let exercise, usersCompletedExercise;
                            exercise = queries[1][0];
                            usersCompletedExercise = queries[0];

                            let response = {
                                ...exercise,
                                usersCompletedExercise:usersCompletedExercise
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
                resolve({'notes': notes});
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
                        return Promise.resolve({alreadyEnrolled: true});
                    } else {
                        return Promise.resolve({alreadyEnrolled: false});
                    }
                })
                .then((response) => {
                    if (response.alreadyEnrolled === false) {
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
                    }
                });
        });
    }
    // Update all courses using default sequenceNum
    public updateCourseSequence(request, h){
        return new Promise((resolve, reject) => {

            database('user_roles').select('user_roles.roles')
                .where({
                    'userId': request.userId
                })
                .then((rows) => {
                    if (rows[0].roles !== 'admin'){
                        reject(Boom.expectationFailed('Admin are only allowed to change course sequence number.'));
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
                                    if (success){
                                            resolve({
                                                "success": success
                                            });
                                    }
                                });
                        } else {
                            reject(Boom.expectationFailed("Minimum 2 courses are required "
                                            + "to change thier sequence number."));
                        }

                    }
                });
        });
    }

    public deleteCourse(request, h){
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
                    if(isAdmin){
                        const courseId = request.params.courseId;
                      return database('courses').select('*')
                        .where({id:courseId})
                        .then((rows) => {
                            // if the course for given id doesn't exist
                            if (rows.length < 1){
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
                                .where({courseId:course.id}).delete()
                                .then(() => {
                                return Promise.resolve(course);
                            });

                })
                .then((course) => {
                    // delete all the submissions for each of the exercises
                    // before deleting the exercises
                    return database('exercises').select('*')
                        .where({courseId:course.id})
                        .then((rows) => {
                            let allSubmissionDeleteQuery = [];
                            for(let i = 0; i < rows.length; i++){
                                let submissionDeleteQuery =
                                            database('submissions')
                                                .select('*')
                                                .where({exerciseId:rows[i].id})
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
                            .where({courseId:course.id}).delete()
                            .then(() => {
                                return Promise.resolve(course);
                            });
                })
                .then((course) => {
                    // after all that deleting delete the course
                    database('courses')
                        .where({id:course.id}).delete()
                        .then(() => {
                            resolve({
                                deleted:true
                            });
                        });
                });   
        });
    }

    public courseComplete(request, h){
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
                    if(rows.length < 1){
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
                                    if(rows.length < 1) {
                                        return Promise.resolve({isMentor: false, mentee});
                                    } else {
                                        return Promise.resolve({isMentor: true, mentee});
                                    }
                                });
                })
                .then((response) => {
                    if(!response.isMentor){
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
                                        if(rows.length < 1){
                                            reject(Boom.expectationFailed(message));
                                            return Promise.reject("Rejected");
                                        } else {
                                            return Promise.resolve()
                                        }
                                    });
                    } else {
                        // proceed if he user is the mentor of th givem menteeId.
                        return Promise.resolve()
                    }
                })
                .then(() => {
                    // check if the course exist or not.
                    return database('courses').select('*')
                                .where({'courses.id': request.params.courseId})
                                .then((rows) => {
                                    if(rows.length < 1){
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
                                    if(rows.length < 1){
                                        reject(Boom.expectationFailed("The student is not enrolled in the course."));
                                        return Promise.reject("Rejected");
                                    } else if (rows[0].courseStatus === 'completed'){
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
                                'course_enrolments.courseStatus':'completed',
                                'course_enrolments.completedAt': new Date(),
                            })
                            .where({
                                'course_enrolments.studentId': request.payload.menteeId,
                                'course_enrolments.courseId': request.params.courseId,
                            })
                            .then((rows) => {
                                resolve({
                                    'success': true
                                })
                            })
                });

        });
    }


}
