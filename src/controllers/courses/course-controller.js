"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Boom = require("boom");
// import * as knex from "knex";
// require newman in your project
const newman = require("newman");
const __1 = require("../../");
const courseHelper_1 = require("../../helpers/courseHelper");
const Configs = require("../../configurations");
var _ = require("underscore");
// import {
//     sendCliqIntimation
// } from "../../cliq";
// import {courseDir} from "../../seed-courses/globals"
var globals = require('../../seed-courses/globals');
class CourseController {
    constructor(configs, database) {
        this.database = database;
        this.configs = configs;
    }
    getCoursesList(request, h) {
        return new Promise((resolve, reject) => {
            let courseConfig = Configs.getCourseConfigs();
            let enrolledCourses = [], allAvailableCourses = [], completedCourses = [];
            let availableQ = __1.default("courses")
                .select("courses.id", "courses.name", "courses.type", "courses.logo", "courses.short_description")
                .then(rows => {
                allAvailableCourses = rows;
                return Promise.resolve();
            });
            availableQ.then(() => {
                resolve({
                    enrolledCourses: [],
                    availableCourses: allAvailableCourses,
                    completedCourses: []
                });
            });
        });
    }
    getCourseTopics(request, h) {
        return new Promise((resolve, reject) => {
            let exercises = [];
            let course_id = parseInt(request.params.courseId, 10);
            let query = __1.default("exercises")
                .select("exercises.id", "exercises.name")
                .where({ "exercises.course_id": course_id })
                .andWhere({ "exercises.parent_exercise_id": null });
            query.then(rows => {
                resolve({ data: rows });
            });
        });
        // let xyz = '(SELECT max(submissions.id) FROM submissions WHERE exercise_id = exercises.id '
        //     + 'AND user_id = ' + 1 + ' ORDER BY state ASC LIMIT 1)';
        // let query = database('exercises')
        //     .select('exercises.id', 'exercises.parent_exercise_id', 'exercises.name', 'exercises.slug', 'exercises.sequence_num',
        //         'exercises.review_type', 'submissions.state as submissionState', 'submissions.id as submissionId',
        //         'submissions.completed_at as submissionCompleteAt', 'submissions.user_id')
        //     .leftJoin('submissions', function () {
        //         this.on('submissions.id', '=',
        //             knex.raw(xyz)
        //         ).on('submissions.user_id', '=', 1);
        //     })
        //     .where({'exercises.course_id': })
        //     .orderBy('exercises.sequence_num', 'asc');
        // query.then((rows) => {
        //     let exercise = rows[0];
        //     
        //     for (let i = 0; i < rows.length; i++) {
        //        if (parseInt(exercise.sequence_num, 10) < 100) {
        //             
        //             exercise = rows[i];
        //             if (!Number.isInteger(exercise.sequence_num)) {
        //                 let parentIndex = parseInt(exercise.sequence_num, 10) - 1;
        //                 exercises[parentIndex].childExercises.push(exercise);
        //             } else {
        //                 exercise.childExercises = [];
        //                 exercises.push(exercise);
        //             }
        //         } else {
        //            exercise = rows[i];
        //            
        //            if (parseInt(exercise.sequence_num, 10) %100 > 0) {
        //               let parentIndex = Math.floor( parseInt(exercise.sequence_num, 10) / 1000 - 1);
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
    getCourseExercises(request, h) {
        return new Promise((resolve, reject) => {
            let exercises = [], query;
            if (request.headers.authorization === undefined) {
                query = __1.default("exercises")
                    .select("exercises.id", "exercises.parent_exercise_id", "exercises.name", "exercises.slug", "exercises.sequence_num", "exercises.review_type", "exercises.github_link", "exercises.submission_type")
                    .where({ "exercises.course_id": request.params.courseId })
                    .orderBy("exercises.sequence_num", "asc");
            }
            else {
                let xyz = "(SELECT id FROM submissions WHERE exercise_id = exercises.id " +
                    "AND user_id = " +
                    request.user_id +
                    " ORDER BY state ASC LIMIT 1)";
                query = __1.default("exercises")
                    .select("exercises.id", "exercises.parent_exercise_id", "exercises.name", "exercises.slug", "exercises.sequence_num", "exercises.review_type", "exercises.github_link", "exercises.submission_type", "submissions.state as submissionState", "submissions.id as submissionId", "submissions.completed_at as submissionCompleteAt", "submissions.user_id")
                    .leftJoin("submissions", function () {
                    this.on("submissions.id", "=", __1.default.raw(xyz)).on("submissions.user_id", "=", request.user_id);
                })
                    .where({ "exercises.course_id": request.params.courseId })
                    .orderBy("exercises.sequence_num", "asc");
            }
            query.then(rows => {
                let exercise = rows[0];
                for (let i = 0; i < rows.length; i++) {
                    if (parseInt(exercise.sequence_num, 10) < 100) {
                        exercise = rows[i];
                        if (!Number.isInteger(exercise.sequence_num)) {
                            let parentIndex = parseInt(exercise.sequence_num, 10) - 1;
                            exercises[parentIndex].childExercises.push(exercise);
                        }
                        else {
                            exercise.childExercises = [];
                            exercises.push(exercise);
                        }
                    }
                    else {
                        exercise = rows[i];
                        if (parseInt(exercise.sequence_num, 10) % 100 > 0) {
                            let parentIndex = Math.floor(parseInt(exercise.sequence_num, 10) / 1000 - 1);
                            exercises[parentIndex].childExercises.push(exercise);
                        }
                        else {
                            exercise.childExercises = [];
                            exercises.push(exercise);
                        }
                    }
                }
                resolve({ data: exercises });
            }).catch((err) => {
                console.log(err);
            });
        });
    }
    getExerciseById(request, h) {
        return new Promise((resolve, reject) => {
            __1.default("exercises")
                .select("exercises.id", "exercises.parent_exercise_id", "exercises.name", "exercises.slug", "exercises.sequence_num", "exercises.review_type", "exercises.content", "exercises.submission_type", "exercises.github_link")
                //  'submissions.state as submissionState', 'submissions.id as submissionId',
                //  'submissions.completed_at as submissionCompleteAt')
                // .leftJoin('submissions', function () {
                //     this.on('submissions.id', '=',
                //         database.raw('(SELECT max(submissions.id) FROM submissions
                //             WHERE exercise_id = exercises.id ORDER BY state ASC LIMIT 1)')
                //     );
                // })
                .where({ "exercises.id": request.params.exerciseId })
                .then(rows => {
                let exercise = rows[0];
                resolve(exercise);
            });
        });
    }
    getSolutionByExerciseId(request, h) {
        return new Promise((resolve, reject) => {
            __1.default("exercises")
                .select("exercises.solution")
                .where({ "exercises.id": request.params.exerciseId })
                .then(rows => {
                resolve(rows);
            });
        });
    }
    getExerciseBySlug(request, h) {
        return new Promise((resolve, reject) => {
            let exerciseQuery;
            if (request.headers.authorization === undefined) {
                exerciseQuery = __1.default("exercises")
                    .select("exercises.id", "exercises.parent_exercise_id", "exercises.name", "exercises.slug", "exercises.sequence_num", "exercises.review_type", "exercises.solution", "exercises.content", "exercises.submission_type", "exercises.github_link")
                    .where({ "exercises.slug": request.query.slug });
                exerciseQuery.then(rows => {
                    resolve(rows[0]);
                });
            }
            else {
                let xyz = "(SELECT id FROM submissions WHERE exercise_id = exercises.id " +
                    "AND user_id = " +
                    request.user_id +
                    "  ORDER BY state ASC LIMIT 1)";
                exerciseQuery = __1.default("exercises")
                    .select("exercises.id", "exercises.parent_exercise_id", "exercises.name", "exercises.slug", "exercises.sequence_num", "exercises.review_type", "exercises.solution", "exercises.content", "exercises.submission_type", "exercises.github_link", "submissions.state as submissionState", "submissions.id as submissionId", "submissions.completed_at as submissionCompleteAt")
                    .leftJoin("submissions", function () {
                    this.on("submissions.id", "=", __1.default.raw(xyz));
                })
                    .where({ "exercises.slug": request.query.slug });
                __1.default("users")
                    .select("users.center")
                    .where({ "users.id": request.user_id })
                    .then(rows => {
                    let usersCompletedExerciseQuery = __1.default("users")
                        .select("users.id", "users.name")
                        .innerJoin("submissions", "submissions.user_id", "=", "users.id")
                        .innerJoin("exercises", function () {
                        this.on("exercises.id", "=", "submissions.exercise_id");
                    })
                        .where({
                        "exercises.slug": request.query.slug,
                        // only those names who have completed the exercise
                        "submissions.completed": 1,
                        "submissions.state": "completed",
                        // first priority to student from same center
                        "users.center": rows[0].center
                    });
                    // select user from submission of same exercise
                    Promise.all([
                        usersCompletedExerciseQuery,
                        exerciseQuery
                    ]).then(queries => {
                        let exercise, usersCompletedExercise, isSolutionAvailable;
                        exercise = queries[1][0];
                        isSolutionAvailable = courseHelper_1.getIsSolutionAvailable(exercise);
                        usersCompletedExercise = queries[0];
                        let response = Object.assign(Object.assign({}, exercise), { usersCompletedExercise: usersCompletedExercise, ifSolution: isSolutionAvailable });
                        resolve(response);
                    });
                });
            }
        });
    }
    enrollInCourse(request, h) {
        //request.user_id = 29;
        return new Promise((resolve, reject) => {
            __1.default("course_enrolments")
                .select("*")
                .where({
                student_id: request.user_id,
                course_id: request.params.courseId
            })
                .then(rows => {
                if (rows.length > 0) {
                    reject(Boom.expectationFailed("An enrolment against the user ID already exists."));
                    return Promise.resolve({ alreadyEnrolled: true });
                }
                else {
                    return Promise.resolve({ alreadyEnrolled: false });
                }
            })
                .then(response => {
                if (response.alreadyEnrolled === false) {
                    courseHelper_1.isStudentEligibleToEnroll(request.user_id, request.params.courseId).then(isStudentEligible => {
                        if (isStudentEligible) {
                            __1.default("courses")
                                .select("courses.id as course_id")
                                .where({
                                "courses.id": request.params.courseId
                            })
                                .then(rows => {
                                if (rows.length > 0) {
                                    return Promise.resolve(rows[0]);
                                }
                                else {
                                    reject(Boom.expectationFailed("The course for given id doesn't exists."));
                                }
                            })
                                .then(({ course_id }) => {
                                __1.default("course_enrolments")
                                    .insert({
                                    student_id: request.user_id,
                                    course_id: course_id
                                })
                                    .then(response => {
                                    resolve({
                                        enrolled: true
                                    });
                                });
                            });
                        }
                        else {
                            reject(Boom.expectationFailed("student has not met the completion threshold for the dependent courses"));
                        }
                    });
                }
            });
        });
    }
    // update by admin from curriculum ....
    updateCourses(request, h) {
        var course_name = (request.params.name);
        return new Promise((resolve, reject) => {
            __1.default("user_roles")
                .select("user_roles.roles")
                .where({
                user_id: request.user_id
            })
                .then((rows) => {
                // here we getting the role of user 
                const isAdmin = rows.length > 0 && courseHelper_1.getUserRoles(rows).isAdmin === true
                    ? true
                    : false;
                if (isAdmin === false) {
                    reject(Boom.expectationFailed("only admin allowed to update course."));
                    return Promise.resolve({ isAdmin: false });
                }
                else {
                    return Promise.resolve({ isAdmin: true });
                }
            })
                .then((response) => {
                if (response.isAdmin === true) {
                    globals.courseDir = course_name;
                    // call newman.run to pass `options` object and wait for callback
                    newman.run({
                        collection: require('../../seed-courses/index')
                    }, function (err) {
                        if (!err) {
                            resolve({
                                update: true
                            });
                        }
                        else {
                            reject(Boom.expectationFailed("Course directory you have specified does not exist."));
                        }
                    });
                }
                else {
                    reject(Boom.expectationFailed("only admin allowed to update course"));
                }
            });
        });
    }
    deleteCourse(request, h) {
        return new Promise((resolve, reject) => {
            __1.default("user_roles")
                .select("roles")
                .where({
                user_id: request.user_id
            })
                .then(rows => {
                const isAdmin = rows.length > 0 && courseHelper_1.getUserRoles(rows).isAdmin === true
                    ? true
                    : false;
                return Promise.resolve(isAdmin);
            })
                .then(isAdmin => {
                // only admin are allowed to delete the courses
                if (isAdmin) {
                    const course_id = request.params.courseId;
                    return __1.default("courses")
                        .select("*")
                        .where({ id: course_id })
                        .then(rows => {
                        // if the course for given id doesn't exist
                        if (rows.length < 1) {
                            reject(Boom.expectationFailed(`course_id: ${course_id} doesn't exists.`));
                            return Promise.reject("Rejected");
                        }
                        else {
                            return Promise.resolve(rows[0]);
                        }
                    });
                }
                else {
                    reject(Boom.expectationFailed("Only Admins are allowed to delete the courses."));
                    return Promise.reject("Rejected");
                }
            })
                .then(course => {
                // delete all the enrollment of the course
                return __1.default("course_enrolments")
                    .where({ course_id: course.id })
                    .delete()
                    .then(() => {
                    return Promise.resolve(course);
                });
            })
                .then(course => {
                // delete all the submissions for each of the exercises
                // before deleting the exercises
                return __1.default("exercises")
                    .select("*")
                    .where({ course_id: course.id })
                    .then(rows => {
                    let allSubmissionDeleteQuery = [];
                    for (let i = 0; i < rows.length; i++) {
                        let submissionDeleteQuery = __1.default("submissions")
                            .select("*")
                            .where({ exercise_id: rows[i].id })
                            .delete();
                        allSubmissionDeleteQuery.push(submissionDeleteQuery);
                    }
                    return Promise.all(allSubmissionDeleteQuery).then(() => {
                        return Promise.resolve(course);
                    });
                });
            })
                .then(course => {
                //after deleting the submissions delete the exercise
                return __1.default("exercises")
                    .where({ course_id: course.id })
                    .delete()
                    .then(() => {
                    return Promise.resolve(course);
                });
            })
                .then(course => {
                // after all that deleting delete the course
                __1.default("courses")
                    .where({ id: course.id })
                    .delete()
                    .then(() => {
                    resolve({
                        deleted: true
                    });
                });
            });
        });
    }
    courseComplete(request, h) {
        // only facilitator of the mentee center or
        // mentor of the mentee can mark the course complete
        // request.user_id = 1;
        return new Promise((resolve, reject) => {
            // check if the student id exist or not.
            __1.default("users")
                .select("*")
                .where({
                "users.id": request.payload.menteeId
            })
                .then(rows => {
                if (rows.length < 1) {
                    reject(Boom.expectationFailed("The menteeId is " +
                        "invalid no student exist with the given menteeId."));
                    return Promise.reject("Rejected");
                }
                else {
                    return Promise.resolve(rows[0]);
                }
            })
                .then(mentee => {
                // check if the is the mentor for the menteeId?
                return __1.default("mentors")
                    .select("*")
                    .where({
                    "mentors.mentor": request.user_id,
                    "mentors.mentee": mentee.id
                })
                    .then(rows => {
                    if (rows.length < 1) {
                        return Promise.resolve({
                            isMentor: false,
                            mentee
                        });
                    }
                    else {
                        return Promise.resolve({
                            isMentor: true,
                            mentee
                        });
                    }
                });
            })
                .then(response => {
                if (!response.isMentor) {
                    const { mentee } = response;
                    // check if he is the facilitator for the menteeId center?
                    return __1.default("user_roles")
                        .select("*")
                        .where({
                        "user_roles.user_id": request.user_id,
                        "user_roles.roles": "facilitator",
                        "user_roles.center": mentee.center
                    })
                        .orWhere({
                        "user_roles.user_id": request.user_id,
                        "user_roles.roles": "facilitator",
                        "user_roles.center": "all"
                    })
                        .then(rows => {
                        let message = "You are not the facilitator for the given mentee's center" +
                            " or the mentor for the given menteeId.";
                        if (rows.length < 1) {
                            reject(Boom.expectationFailed(message));
                            return Promise.reject("Rejected");
                        }
                        else {
                            return Promise.resolve();
                        }
                    });
                }
                else {
                    // proceed if he user is the mentor of th givem menteeId.
                    return Promise.resolve();
                }
            })
                .then(() => {
                // check if the course exist or not.
                return __1.default("courses")
                    .select("*")
                    .where({ "courses.id": request.params.courseId })
                    .then(rows => {
                    if (rows.length < 1) {
                        reject(Boom.expectationFailed("The course id doesn't exist."));
                        return Promise.reject("Rejected");
                    }
                    else {
                        return Promise.resolve();
                    }
                });
            })
                .then(() => {
                // check if the student have enrolled in the course.
                return __1.default("course_enrolments")
                    .select("*")
                    .where({
                    "course_enrolments.student_id": request.payload.menteeId,
                    "course_enrolments.course_id": request.params.courseId
                })
                    .then(rows => {
                    if (rows.length < 1) {
                        reject(Boom.expectationFailed("The student is not enrolled in the course."));
                        return Promise.reject("Rejected");
                    }
                    else if (rows[0].course_status === "completed") {
                        reject(Boom.expectationFailed("The student have already " +
                            "completed the course."));
                        return Promise.reject("Rejected");
                    }
                    else {
                        return Promise.resolve();
                    }
                });
            })
                .then(() => {
                // mark the course complete here.
                __1.default("course_enrolments")
                    .update({
                    "course_enrolments.course_status": "completed",
                    "course_enrolments.completed_at": new Date()
                })
                    .where({
                    "course_enrolments.student_id": request.payload.menteeId,
                    "course_enrolments.course_id": request.params.courseId
                })
                    .then(rows => {
                    // let studentObject = {
                    //     "receiverId": student.email,
                    //     "message": ` Your course has been marked as completed `
                    // }
                    // sendCliqIntimation(studentObject).then(result => {
                    //     
                    // })
                    resolve({
                        success: true
                    });
                });
            });
        });
    }
    getCourseRelationList(request, h) {
        //request.user_id = 122;
        return new Promise((resolve, reject) => {
            __1.default("user_roles")
                .select("roles")
                .where({
                user_id: request.user_id
            })
                // .whereIn(
                //     'center', [request.query.centerId, 'all']
                // )
                .then((rows) => {
                const access = courseHelper_1.getUserRoles(rows);
                const isAdmin = (rows.length > 0 && access.isAdmin === true) ? true : false;
                const isFacilitator = (rows.length > 0 && access.isFacilitator === true) ? true : false;
                const isTnp = (rows.length > 0 && access.isTnp === true) ? true : false;
                const userRole = (rows.length > 0 && access.roles !== undefined) ? access.roles : false;
                return Promise.resolve({ isAdmin, isFacilitator, isTnp, userRole });
            }).then(({ isAdmin, isFacilitator, isTnp, userRole }) => {
                // only admin are allowed to delete the courses
                if (isAdmin || isFacilitator || isTnp) {
                    let query = __1.default("course_relation").select("*");
                    query.then(rows => {
                        if (rows.length > 0) {
                            resolve({ data: rows });
                        }
                        else {
                            resolve({
                                data: [],
                                message: "Not added any course dependencies for the courses..."
                            });
                        }
                    });
                }
                else {
                    reject(Boom.expectationFailed("Only Admins or facilitator or tnp are allowed to add the course dependencies."));
                    return Promise.reject("Rejected");
                }
            });
        });
    }
    deleteCourseRelation(request, h) {
        return new Promise((resolve, reject) => {
            __1.default("user_roles")
                .select("roles")
                .where({
                user_id: request.user_id
            })
                .then(rows => {
                const isAdmin = rows.length > 0 && courseHelper_1.getUserRoles(rows).isAdmin === true
                    ? true
                    : false;
                return Promise.resolve(isAdmin);
            })
                .then(isAdmin => {
                // only admin are allowed to add the courses
                if (isAdmin) {
                    __1.default("course_relation")
                        .select("*")
                        .where({
                        course_id: request.params.courseId,
                        relies_on: request.params.reliesOn
                    })
                        .then(rows => {
                        if (rows.length > 0) {
                            __1.default("course_relation")
                                .where({
                                course_id: request.params.courseId,
                                relies_on: request.params.reliesOn
                            })
                                .delete()
                                .then(() => {
                                resolve({
                                    deleted: true
                                });
                            });
                        }
                        else {
                            reject(Boom.expectationFailed("Course Dependency to the corresponding course id does not exists."));
                        }
                    });
                }
                else {
                    reject(Boom.expectationFailed("Only Admins are allowed to add the course dependencies."));
                    return Promise.reject("Rejected");
                }
            });
        });
    }
    addCourseRelation(request, h) {
        return new Promise((resolve, reject) => {
            __1.default("user_roles")
                .select("roles")
                .where({
                user_id: request.user_id
            })
                .then(rows => {
                const isAdmin = rows.length > 0 && courseHelper_1.getUserRoles(rows).isAdmin === true
                    ? true
                    : false;
                return Promise.resolve(isAdmin);
            })
                .then(isAdmin => {
                // only admin are allowed to add the courses
                if (isAdmin) {
                    __1.default("course_relation")
                        .select("*")
                        .where({
                        course_id: request.params.courseId,
                        relies_on: request.params.reliesOn
                    })
                        .then(rows => {
                        if (rows.length > 0) {
                            reject(Boom.expectationFailed("Course Dependency to the corresponding course id already exists."));
                            return Promise.resolve({
                                alreadyAddedCourseDependency: true
                            });
                        }
                        else {
                            return Promise.resolve({
                                alreadyAddedCourseDependency: false
                            });
                        }
                    })
                        .then(response => {
                        if (response.alreadyAddedCourseDependency ===
                            false) {
                            __1.default("course_relation")
                                .insert({
                                course_id: request.params.courseId,
                                relies_on: request.params.reliesOn
                            })
                                .then(response => {
                                resolve({
                                    Added: true
                                });
                            });
                        }
                    });
                }
                else {
                    reject(Boom.expectationFailed("Only Admins are allowed to add the course dependencies."));
                    return Promise.reject("Rejected");
                }
            });
        });
    }
    /**
     * Get complete list of student for whome mentore has not been assigned
     * @param request
     * @param h
     */
    getStudentsWithoutMentorList(request, h) {
        return new Promise((resolve, reject) => {
            __1.default("user_roles")
                .select("roles")
                .where({
                user_id: request.user_id
            })
                .whereIn('center', [request.query.centerId, 'all'])
                .then((rows) => {
                const access = courseHelper_1.getUserRoles(rows);
                const isAdmin = (rows.length > 0 && access.isAdmin === true) ? true : false;
                const isFacilitator = (rows.length > 0 && access.isFacilitator === true) ? true : false;
                const isTnp = (rows.length > 0 && access.isTnp === true) ? true : false;
                const userRole = (rows.length > 0 && access.roles !== undefined) ? access.roles : false;
                return Promise.resolve({ isAdmin, isFacilitator, isTnp, userRole });
            }).then(({ isAdmin, isFacilitator, isTnp, userRole }) => {
                // only admin are allowed to delete the courses
                if (isAdmin || isFacilitator || isTnp) {
                    __1.default("users")
                        .select("users.id", "users.center", "users.name", "users.email", "user_roles.roles")
                        .innerJoin("user_roles", "user_roles.user_id", "users.id")
                        .leftJoin("mentors", "user_roles.user_id", "mentors.mentee")
                        .where({
                        "user_roles.roles": 3
                    })
                        .andWhere(function () {
                        if (request.query.centerId &&
                            request.query.centerId.length > 0)
                            this.where({
                                "users.center": request.query.centerId
                            });
                    })
                        .whereNull("mentee")
                        .then(rows => {
                        if (rows.length < 1) {
                            reject(Boom.expectationFailed("No student exist with out mentor."));
                        }
                        else {
                            //  
                            resolve({ data: rows });
                        }
                    });
                }
                else {
                    reject(Boom.expectationFailed(` ${userRole} is not allowed to add the course dependencies.`));
                    return Promise.reject("Rejected");
                }
            });
        });
    }
    /**
     * Get complete list of student with a mentor  where mentorId will be params and centerId will be query parameter
     * @param request
     * @param h
     */
    getStudentsWithMentorList(request, h) {
        return new Promise((resolve, reject) => {
            __1.default("user_roles")
                .select("roles")
                .where({
                user_id: request.user_id
            })
                .whereIn('center', [request.query.centerId, 'all'])
                .then((rows) => {
                const access = courseHelper_1.getUserRoles(rows);
                const isAdmin = (rows.length > 0 && access.isAdmin === true) ? true : false;
                const isFacilitator = (rows.length > 0 && access.isFacilitator === true) ? true : false;
                const isTnp = (rows.length > 0 && access.isTnp === true) ? true : false;
                const userRole = (rows.length > 0 && access.roles !== undefined) ? access.roles : false;
                return Promise.resolve({ isAdmin, isFacilitator, isTnp, userRole });
            }).then(({ isAdmin, isFacilitator, isTnp, userRole }) => {
                // only admin are allowed to delete the courses
                if (isAdmin || isFacilitator || isTnp) {
                    __1.default("users")
                        .select("users.id", "users.name", "users.center", "users.email", "user_roles.roles", "mentors.mentor")
                        .innerJoin("user_roles", "user_roles.user_id", "users.id")
                        .leftJoin("mentors", "user_roles.user_id", "mentors.mentee")
                        .where({
                        "user_roles.roles": 3,
                        "mentors.mentor": request.params.mentorId
                    })
                        .andWhere(function () {
                        if (request.query.centerId &&
                            request.query.centerId.length > 0)
                            this.where({
                                "users.center": request.query.centerId
                            });
                    })
                        .then(rows => {
                        if (rows.length < 1) {
                            reject(Boom.expectationFailed("No student exist with this mentor."));
                        }
                        else {
                            resolve({ data: rows });
                        }
                    });
                }
                else {
                    reject(Boom.expectationFailed(`${userRole} are not allowed to add the course dependencies.`));
                    return Promise.reject("Rejected");
                }
            });
        });
    }
    /**
     * Get complete list of student and mentor where pass centerId as a query parameter
     * @param request
     * @param h
     */
    getMentorsOrMenteesList(request, h) {
        return new Promise((resolve, reject) => {
            __1.default("user_roles")
                .select("roles")
                .where({
                user_id: request.user_id
            })
                .whereIn('center', [request.query.centerId, 'all']).then((rows) => {
                const access = courseHelper_1.getUserRoles(rows);
                const isAdmin = (rows.length > 0 && access.isAdmin === true) ? true : false;
                const isFacilitator = (rows.length > 0 && access.isFacilitator === true) ? true : false;
                const isTnp = (rows.length > 0 && access.isTnp === true) ? true : false;
                const userRole = (rows.length > 0 && access.roles !== undefined) ? access.roles : false;
                return Promise.resolve({ isAdmin, isFacilitator, isTnp, userRole });
            }).then(({ isAdmin, isFacilitator, isTnp, userRole }) => {
                // only admin facilitator or tnp  are allowed to delete the courses
                if (isAdmin || isFacilitator || isTnp) {
                    let mentorListResult = [], menteeListResult = [];
                    // get the all mentore list
                    let subquery = __1.default("users")
                        .select("mentors.mentee")
                        .innerJoin("mentors", "users.id", "mentors.mentor")
                        .andWhere(function () {
                        if (request.query.centerId &&
                            request.query.centerId.length > 0)
                            this.where({
                                "users.center": request.query.centerId
                            });
                    });
                    let mentorList = __1.default("users")
                        .select("mentors.mentor as mentorId", "users.name", "users.center", "users.email")
                        // .select('mentors.mentor as mentorId', 'users.name', 'users.center', 'users.email')
                        // .innerJoin('user_roles', 'user_roles.user_id', 'users.id')
                        .innerJoin("mentors", "users.id", "mentors.mentor")
                        // .where({
                        //     'user_roles.roles': 2,
                        // })
                        .andWhere(function () {
                        if (request.query.centerId &&
                            request.query.centerId.length > 0)
                            this.where({
                                "users.center": request.query.centerId
                            });
                    });
                    mentorList
                        .whereNotIn("mentors.mentor", subquery)
                        .orderBy("mentors.mentor")
                        .groupBy("mentors.mentor");
                    //
                    mentorList.then(rows => {
                        for (let j = 0; j < rows.length; j++) {
                            rows[j].menteeId = 0;
                        }
                        if (rows.length < 1) {
                            reject(Boom.expectationFailed("No mentor is present for this center."));
                        }
                        else {
                            mentorListResult = rows;
                            return Promise.resolve(mentorListResult);
                        }
                    });
                    let menteeList = __1.default("users")
                        .select("mentors.mentor as mentorId", "mentors.mentee as menteeId", "users.name", "users.center", "users.email", "user_roles.roles")
                        .innerJoin("user_roles", "user_roles.user_id", "users.id")
                        .innerJoin("mentors", "user_roles.user_id", "mentors.mentee")
                        // .where({
                        //     'mentors.mentor': rows[i].mentorId,
                        // })
                        .andWhere(function () {
                        if (request.query.centerId &&
                            request.query.centerId.length > 0)
                            this.where({
                                "users.center": request.query.centerId
                            });
                    })
                        .orderBy("mentors.mentee");
                    //
                    menteeList.then(rows => {
                        if (rows.length < 1) {
                            reject(Boom.expectationFailed("No mentor is present for this center."));
                        }
                        else {
                            menteeListResult = rows;
                            return Promise.resolve(menteeListResult);
                        }
                    });
                    Promise.all([mentorList, menteeList]).then(() => {
                        //Array.prototype.push.apply(mentorListResult, menteeListResult);
                        let menteeTreeList = courseHelper_1.listToTree(menteeListResult);
                        let totalTreeList = courseHelper_1.addingRootNode(mentorListResult, menteeTreeList);
                        resolve(totalTreeList);
                    });
                }
                else {
                    reject(Boom.expectationFailed(`${userRole} are not allowed to list mentor mentee.`));
                    return Promise.reject("Rejected");
                }
            });
        });
    }
    /**
     * Delete the mentor and mentee record.
     * @param request
     * @param h
     */
    deleteMentorMentee(request, h) {
        return new Promise((resolve, reject) => {
            __1.default("user_roles")
                .select("roles")
                .where({
                user_id: request.user_id
            })
                .then((rows) => {
                const access = courseHelper_1.getUserRoles(rows);
                const isAdmin = (rows.length > 0 && access.isAdmin === true) ? true : false;
                const isFacilitator = (rows.length > 0 && access.isFacilitator === true) ? true : false;
                const isTnp = (rows.length > 0 && access.isTnp === true) ? true : false;
                const userRole = (rows.length > 0 && access.roles !== undefined) ? access.roles : false;
                return Promise.resolve({ isAdmin, isFacilitator, isTnp, userRole });
            }).then(({ isAdmin, isFacilitator, isTnp, userRole }) => {
                // only admin are allowed to delete the courses
                if (isAdmin || isFacilitator || isTnp) {
                    const mentorId = request.params.mentorId;
                    const menteeId = request.params.menteeId;
                    let mentorExist = false, menteeExist = false;
                    let mentor = __1.default("mentors")
                        .select("*")
                        .where({
                        mentor: mentorId
                    })
                        .then(rows => {
                        if (rows.length < 1) {
                            // reject(Boom.expectationFailed(` This mentor doesn't exists.`));
                            //return Promise.reject("Rejected");
                            return Promise.resolve(mentorExist);
                        }
                        else {
                            mentorExist = true;
                            return Promise.resolve(mentorExist);
                        }
                    });
                    let mentee = __1.default("mentors")
                        .select("*")
                        .where({
                        mentee: menteeId
                    })
                        .then(rows => {
                        if (rows.length < 1) {
                            //  reject(Boom.expectationFailed(` This mentee doesn't exists.`));
                            //return Promise.reject("Rejected");
                            return Promise.resolve(menteeExist);
                        }
                        else {
                            menteeExist = true;
                            return Promise.resolve(menteeExist);
                        }
                    });
                    Promise.all([mentor, mentee])
                        .then(() => {
                        if (mentorExist && menteeExist) {
                            return __1.default("mentors")
                                .select("*")
                                .where({
                                mentor: mentorId,
                                mentee: menteeId
                            })
                                .then(rows => {
                                // if the course for given id doesn't exist
                                if (rows.length < 1) {
                                    reject(Boom.expectationFailed(` The mentorId  is not the mentor of the menteeId.`));
                                    return Promise.reject("Rejected");
                                }
                                else {
                                    return Promise.resolve(rows[0]);
                                }
                            });
                        }
                        else if (mentorExist && !menteeExist) {
                            reject(Boom.expectationFailed(` The menteeId doesn't have any mentor.`));
                            return Promise.reject("Rejected");
                        }
                        else if (!mentorExist && menteeExist) {
                            reject(Boom.expectationFailed(` The mentorId is not a mentor.`));
                            return Promise.reject("Rejected");
                        }
                        else {
                            reject(Boom.expectationFailed(` MentorId and menteeId both doesn't exist in the platform.`));
                            return Promise.reject("Rejected");
                        }
                    })
                        .then(mentors => {
                        // after all that deleting delete the course
                        __1.default("mentors")
                            .where({ id: mentors.id })
                            .delete()
                            .then((data) => {
                            if (data) {
                                resolve({
                                    deleted: true
                                });
                            }
                            else {
                                reject(Boom.expectationFailed(`There was an error during delete operation `));
                                return Promise.reject("Rejected");
                            }
                        });
                    });
                }
                else {
                    reject(Boom.expectationFailed(`${userRole} not allowed to delete the mentors and mentee.`));
                    return Promise.reject("Rejected");
                }
            });
        });
    }
    /**
     * Delete the mentee by id and mentor by id or email.
     * @param request
     * @param h
     */
    deleteMentorMenteeByidOrEmail(request, h) {
        return new Promise((resolve, reject) => {
            __1.default('user_roles').select('roles', 'center')
                .where({
                'user_id': request.user_id
            }).then((rows) => {
                let access = courseHelper_1.getUserRoles(rows);
                const isAdmin = (rows.length > 0 && access.isAdmin === true) ? true : false;
                const isFacilitator = (rows.length > 0 && access.isFacilitator === true) ? true : false;
                const isTnp = (rows.length > 0 && access.isTnp === true) ? true : false;
                const userRole = (rows.length > 0 && access.roles !== undefined) ? access.roles : false;
                const center = access.center;
                return Promise.resolve({ isAdmin, isFacilitator, isTnp, userRole, center });
            }).then(({ isAdmin, isFacilitator, isTnp, userRole, center }) => {
                // only admin are allowed to delete the courses
                if (isAdmin || isFacilitator || isTnp) {
                    const mentorId = request.payload.mentorId;
                    const menteeId = request.payload.menteeId;
                    const mentorEmail = request.payload.mentorEmail;
                    let mentorExist = false, menteeExist = false;
                    let mentorByEmail = {}, mentor = {};
                    if (mentorId !== undefined) {
                        mentor = __1.default('mentors').select('*')
                            .where({
                            'mentor': mentorId,
                        }).then((rows) => {
                            if (rows.length < 1) {
                                // reject(Boom.expectationFailed(` This mentor doesn't exists.`));
                                //return Promise.reject("Rejected");
                                return Promise.resolve(mentorExist);
                            }
                            else {
                                mentorExist = true;
                                return Promise.resolve(mentorExist);
                            }
                        });
                    }
                    let mentee = __1.default('mentors').select('*')
                        .where({
                        'mentee': menteeId
                    }).then((rows) => {
                        if (rows.length < 1) {
                            //  reject(Boom.expectationFailed(` This mentee doesn't exists.`));
                            //return Promise.reject("Rejected");
                            return Promise.resolve(menteeExist);
                        }
                        else {
                            menteeExist = true;
                            return Promise.resolve(menteeExist);
                        }
                    });
                    if (mentorEmail !== undefined) {
                        mentorByEmail = __1.default('mentors').select('*').
                            innerJoin('users', 'users.id', 'mentors.mentor')
                            .where({
                            'users.email': mentorEmail
                        }).then((rows) => {
                            if (rows.length < 1) {
                                //  reject(Boom.expectationFailed(` This mentee doesn't exists.`));
                                //return Promise.reject("Rejected");
                                return Promise.resolve(mentorExist);
                            }
                            else {
                                mentorExist = true;
                                return Promise.resolve(mentorExist);
                            }
                        });
                    }
                    Promise.all([mentor, mentee, mentorByEmail]).then(() => {
                        if (mentorExist && menteeExist) {
                            let allCenter = [];
                            let locationSet = new Set(allCenter.concat(center.isAdmin, center.isFacilitator, center.isTnp));
                            allCenter = Array.from(locationSet);
                            let getMentorMenteeQuery = __1.default('mentors').select('mentors.id as mentorsTableId', 'users.id as userID')
                                .innerJoin('users', 'users.id', 'mentors.mentor')
                                .where({
                                'mentors.mentee': menteeId
                            }).andWhere(function () {
                                if (mentorId !== undefined)
                                    this.where({ 'mentors.mentor': mentorId });
                            }).andWhere(function () {
                                if (mentorEmail !== undefined)
                                    this.where({ 'users.email': mentorEmail });
                            });
                            getMentorMenteeQuery.then((rows) => {
                                // if the course for given id doesn't exist
                                if (rows.length < 1) {
                                    reject(Boom.expectationFailed(` The mentorId is not the mentor of the menteeId.`));
                                    return Promise.reject("Rejected");
                                }
                                else {
                                    getMentorMenteeQuery.andWhere(function () {
                                        if (allCenter.indexOf("all") == -1)
                                            this.whereIn('users.center', allCenter);
                                    }).then((mentors) => {
                                        //  
                                        // if the course for given id doesn't exist
                                        if (mentors.length < 1) {
                                            reject(Boom.expectationFailed(`You are not allowed to delete record for this location `));
                                            return Promise.reject("Rejected");
                                        }
                                        else {
                                            // after all that deleting delete the course
                                            __1.default('mentors')
                                                .where({ id: mentors[0].mentorsTableId }).delete()
                                                .then((data) => {
                                                if (data) {
                                                    resolve({
                                                        deleted: true
                                                    });
                                                }
                                                else {
                                                    reject(Boom.expectationFailed(`There was an error during delete operation `));
                                                    return Promise.reject("Rejected");
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                        else if (mentorExist && !menteeExist) {
                            reject(Boom.expectationFailed(` The menteeId does not exist on the system .`));
                            return Promise.reject("Rejected");
                        }
                        else if (!mentorExist && menteeExist) {
                            reject(Boom.expectationFailed(` The mentorId or email does not exist on the system.`));
                            return Promise.reject("Rejected");
                        }
                        else {
                            reject(Boom.expectationFailed(` MentorId and menteeId both doesn't exist in the platform.`));
                            return Promise.reject("Rejected");
                        }
                    });
                }
                else {
                    reject(Boom.expectationFailed(` ${userRole} are not allowed to delete the mentors and mentee.`));
                    return Promise.reject("Rejected");
                }
            });
        });
    }
}
exports.default = CourseController;
//# sourceMappingURL=course-controller.js.map