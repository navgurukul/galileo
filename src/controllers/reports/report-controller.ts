import * as Hapi from "hapi";
import * as Boom from "boom";
import * as Jwt from "jsonwebtoken";
import * as GoogleAuth from "google-auth-library";

import database from "../../";
import { IServerConfigurations, getScheduleConfigs } from "../../configurations";
import { resolve } from "path";

import {
    getforIndivisualTimePeriod,
    getNumberOfAssignmentSubmittedPerUser
} from "../../helpers/reportHelper";

import {
    sendSubmissionReport
} from "../../sendEmail";



export default class ReportController {
    private configs: IServerConfigurations;
    private database: any;
    private user: any;
   
    constructor(configs: IServerConfigurations, database: any) {
        this.database = database;
        this.configs = configs;
    }

    // public getBatchCourseReport(request: Hapi.Request, reply: Hapi.IReply) {
    //
    //     /********************************************************
    //      * Note From Rishabh:
    //      * This code is uber fucked. I am too sleepy and just
    //      * putting up a working version out there. Will get to
    //      * refactoring it soon :)
    //      ********************************************************/
    //
    //     let usersList;
    //     let exercisesList = {};
    //
    //     let userQuery =
    //         database('course_enrolments')
    //             .select('users.name', 'users.id', 'users.profilePicture', 'users.facilitator')
    //             .innerJoin('users', 'course_enrolments.studentId', 'users.id')
    //             .where({
    //                 'course_enrolments.batchId': request.params.batchId,
    //                 'course_enrolments.courseId': request.params.courseId
    //             })
    //             .then((rows) => {
    //                 usersList = rows;
    //             });
    //
    //     let exercisesQuery =
    //         database('exercises')
    //             .select('id', 'parentExerciseId', 'name', 'slug', 'sequenceNum', 'reviewType', 'content')
    //             .where({'courseId': request.params.courseId})
    //             .orderBy('sequenceNum', 'asc')
    //             .then((rows) => {
    //                 for (let i = 0; i < rows.length; i++) {
    //                     exercisesList[rows[i].id] = rows[i];
    //                     exercisesList[rows[i].id]['completionDetails'] = {};
    //                 }
    //             });
    //
    //     Promise.all([userQuery, exercisesQuery]).then(() => {
    //         return database('submissions')
    //             .select('submissions.id', 'submissions.exerciseId', 'submissions.userId', 'submissions.submittedAt',
    //                 'submissions.submitterNotes', 'submissions.files', 'submissions.state',
    //                 'submissions.completed', 'submissions.completedAt')
    //             .innerJoin('exercises', 'submissions.exerciseId', 'exercises.id')
    //             .where({'exercises.courseId': request.params.courseId})
    //             .then((rows) => {
    //                 return Promise.resolve(rows);
    //             });
    //     })
    //         .then((rows) => {
    //             for (let i = 0; i < rows.length; i++) {
    //                 let submission = rows[i];
    //                 // Parse the files as JSON
    //                 if (submission.files !== null) {
    //                     submission.files = JSON.parse(submission.files);
    //                 }
    //                 /*
    //                 1. Check if a submission of higher or same level exist in the corresponding exercise/student id dict
    //                 2. If it does do not do anything
    //                 3. If it does not then replace it
    //                 */
    //                 let subStateOrder = ['rejected', 'pending', 'completed'];
    //                 let curSubState = subStateOrder.indexOf(submission.state);
    //                 let storedSubmission = exercisesList[submission.exerciseId]['completionDetails'][submission.userId] || {};
    //
    //                 // No submission is stored in the object
    //                 if (Object.keys(storedSubmission).length === 0) {
    //                     exercisesList[submission.exerciseId]['completionDetails'][submission.userId] = submission;
    //                     exercisesList[submission.exerciseId]['completionDetails'][submission.userId]['attempts'] = 1;
    //                 }
    //                 // If the submission is stored
    //                 else {
    //                     let storedSubState = subStateOrder.indexOf(storedSubmission.state);
    //                     let attempts = exercisesList[submission.exerciseId]['completionDetails']
    //                         [submission.userId]['attempts'] + 1;
    //                     // Replace the stored submission with the current submission if
    //                     // the stored one is of a lesser level
    //                     if (storedSubState < curSubState) {
    //                         exercisesList[submission.exerciseId]['completionDetails'][submission.userId] = submission;
    //                     }
    //                     exercisesList[submission.exerciseId]['completionDetails'][submission.userId]['attempts'] = attempts;
    //                 }
    //             }
    //
    //             //  Convert the dictionary of exercises into an array to return
    //             let _exercises = [];
    //             for (let i of Object.keys(exercisesList)) {
    //                 _exercises.push(exercisesList[i]);
    //             }
    //             // Sort the exercises on basis of sequence numbers
    //             _exercises.sort((a, b) => {
    //                 if (a.sequenceNum < b.sequenceNum) {
    //                     return -1;
    //                 } else if (a.sequenceNum > b.sequenceNum) {
    //                     return 1;
    //                 } else {
    //                     return 0;
    //                 }
    //             });
    //             // Nest child exercises in parent exercises
    //             let exercises = [];
    //             for (let i = 0; i < _exercises.length; i++) {
    //                 let exercise = _exercises[i];
    //                 if (exercise.sequenceNum % 1 !== 0) {
    //                     let parentIndex = Number(String(exercise.sequenceNum).split('.')[0]) - 1;
    //                     exercises[parentIndex].childExercises.push(exercise);
    //                 } else {
    //                     exercise.childExercises = [];
    //                     exercises.push(exercise);
    //                 }
    //             }
    //             return reply({
    //                 "exercises": exercises,
    //                 "users": usersList
    //             });
    //         });
    //
    // }

    public getStudentReport(request, h) {
        return new Promise((resolve, reject) => {
            let submissionsObj = {};
            let submissionsList = [];
            database("submissions")
                .select(
                    "submissions.id",
                    "submissions.exerciseId",
                    "submissions.userId",
                    "submissions.submittedAt",
                    "submissions.submitterNotes",
                    "submissions.files",
                    "submissions.state",
                    "submissions.completed",
                    "submissions.completedAt",
                    "exercises.name"
                )
                .innerJoin(
                    "exercises",
                    "submissions.exerciseId",
                    "exercises.id"
                )
                .where({
                    "exercises.courseId": request.params.courseId,
                    "submissions.userId": request.params.userId
                })
                .then(rows => {
                    return Promise.resolve(rows);
                })
                .then(rows => {
                    for (let i = 0; i < rows.length; i++) {
                        let submission = rows[i];
                        // Parse the files as JSON
                        if (submission.files !== null) {
                            submission.files = JSON.parse(submission.files);
                        }
                        /*
                        1. Check if a submission of higher or same level exist in the corresponding exercise/student id dict
                        2. If it does do not do anything
                        3. If it does not then replace it
                        */
                        let subStateOrder = [
                            "rejected",
                            "pending",
                            "completed"
                        ];
                        let curSubState = subStateOrder.indexOf(
                            submission.state
                        );
                        let storedSubmission =
                            submissionsObj[submission.exerciseId] || {};

                        // No submission is stored in the object
                        if (Object.keys(storedSubmission).length === 0) {
                            submissionsObj[submission.exerciseId] = submission;
                            submissionsObj[submission.exerciseId][
                                "attempts"
                            ] = 1;
                        }
                        // If the submission is stored
                        else {
                            let storedSubState = subStateOrder.indexOf(
                                storedSubmission.state
                            );
                            let attempts =
                                submissionsObj[submission.exerciseId][
                                "attempts"
                                ] + 1;
                            // Replace the stored submission with the current submission if
                            // the stored one is of a lesser level
                            if (storedSubState < curSubState) {
                                submissionsObj[
                                    submission.exerciseId
                                ] = submission;
                            }
                            submissionsObj[submission.exerciseId][
                                "attempts"
                            ] = attempts;
                        }
                    }
                    for (let exerciseId in submissionsObj) {
                        if (submissionsObj.hasOwnProperty(exerciseId)) {
                            submissionsList.push(submissionsObj[exerciseId]);
                        }
                    }
                    resolve({
                        data: submissionsList
                    });
                });
        });
    }

    public getMenteesCoursesReport(request, h) {
        return new Promise((resolve, reject) => {
            // request.userId = 2;
            let mentees = [],
                menteesCoursesReport = [];

            database("user_roles")
                .select("*")
                .where({
                    "user_roles.userId": request.userId,
                    "user_roles.roles": "facilitator"
                })
                .then(rows => {
                    // check if he is a facilitator?
                    if (rows.length < 1) {
                        return Promise.resolve({
                            isFacilitator: false,
                            center: null
                        });
                    } else {
                        return Promise.resolve({
                            isFacilitator: true,
                            center: rows[0].center
                        });
                    }
                })
                .then(response => {
                    // if not check if he is mentor
                    if (response.isFacilitator === true) {
                        return Promise.resolve(response);
                    } else {
                        // if not then reject the Request.
                        return database("mentors")
                            .select("*")
                            .where({
                                "mentors.mentor": request.userId
                            })
                            .then(rows => {
                                if (rows.length < 1) {
                                    reject(
                                        Boom.expectationFailed(
                                            "User is niether mentor for any student " +
                                            "nor facilitator for any center"
                                        )
                                    );
                                    return Promise.reject("Rejected");
                                } else {
                                    return Promise.resolve({
                                        isFacilitator: false,
                                        center: null
                                    });
                                }
                            });
                    }
                })
                .then(response => {
                    // Query to get totalExercises which has submissionType != NULL and it's submission status
                    const totalExercisesQ =
                        "COUNT(CASE WHEN exercises.submissionType " +
                        "IS NOT NULL THEN 1 END) as totalExercises";
                    const completedSubmissionsQ =
                        "COUNT(DISTINCT submissions.id) as completedSubmissions";

                    let menteeQ, menteesReportQ;
                    if (response.isFacilitator === true) {
                        // TODO: mentees are only who have the user_roles as student.
                        let whereClause = {
                            "user_roles.roles": "student"
                        };

                        if (response.center !== "all") {
                            whereClause["users.center"] = response.center;
                        }

                        // if mentor then find all his mentee and then select there course Report
                        menteeQ = database("users")
                            .select("users.id", "users.name", "users.email")
                            .innerJoin(
                                "user_roles",
                                "user_roles.userId",
                                "users.id"
                            )
                            .where(whereClause)
                            .then(rows => {
                                mentees = rows;
                                return Promise.resolve();
                            });

                        // query for the course report of the mentee assigned to the mentor
                        menteesReportQ = database("course_enrolments")
                            .select(
                                // course details in which the mentee has enrolled
                                "courses.name as courseName",
                                "courses.id as courseId",
                                "course_enrolments.courseStatus as menteeCourseStatus",
                                database.raw(totalExercisesQ),
                                database.raw(completedSubmissionsQ),
                                // mentees details
                                "users.name as menteeName",
                                "users.email as menteeEmail"
                            )
                            .innerJoin(
                                "courses",
                                "courses.id",
                                "course_enrolments.courseId"
                            )
                            .innerJoin(
                                "users",
                                "course_enrolments.studentId",
                                "users.id"
                            )
                            .innerJoin(
                                "user_roles",
                                "user_roles.userId",
                                "users.id"
                            )
                            .innerJoin(
                                "exercises",
                                "course_enrolments.courseId",
                                "exercises.courseId"
                            )
                            .leftJoin("submissions", function () {
                                this.on("submissions.userId", "=", "users.id")
                                    .andOn(
                                        "submissions.exerciseId",
                                        "=",
                                        "exercises.id"
                                    )
                                    .andOn("submissions.completed", "=", 1);
                            })
                            .where(whereClause)
                            .groupBy("course_enrolments.id")
                            .distinct("users.id as menteeId")
                            .then(rows => {
                                menteesCoursesReport = rows;
                                return Promise.resolve();
                            });

                        return Promise.all([menteeQ, menteesReportQ]).then(
                            queries => {
                                return Promise.resolve();
                            }
                        );
                    } else {
                        // if mentor then find all his mentee and then select there course Report
                        menteeQ = database("users")
                            .select("users.id", "users.name", "users.email")
                            .innerJoin("mentors", "mentors.mentee", "users.id")
                            .where({
                                "mentors.mentor": request.userId
                            })
                            .then(rows => {
                                mentees = rows;
                                return Promise.resolve();
                            });

                        // query for the course report of the mentee assigned to the mentor
                        menteesReportQ = database("course_enrolments")
                            .select(
                                // course details in which the mentee has enrolled
                                "courses.name as courseName",
                                "courses.id as courseId",
                                "course_enrolments.courseStatus as menteeCourseStatus",
                                database.raw(totalExercisesQ),
                                database.raw(completedSubmissionsQ),
                                // mentees details
                                "users.name as menteeName",
                                "users.email as menteeEmail"
                            )
                            .innerJoin(
                                "courses",
                                "courses.id",
                                "course_enrolments.courseId"
                            )
                            .innerJoin(
                                "mentors",
                                "course_enrolments.studentId",
                                "mentors.mentee"
                            )
                            .innerJoin("users", "users.id", "mentors.mentee")
                            .innerJoin(
                                "exercises",
                                "course_enrolments.courseId",
                                "exercises.courseId"
                            )
                            .leftJoin("submissions", function () {
                                this.on(
                                    "submissions.userId",
                                    "=",
                                    "mentors.mentee"
                                )
                                    .andOn(
                                        "submissions.exerciseId",
                                        "=",
                                        "exercises.id"
                                    )
                                    .andOn("submissions.completed", "=", 1);
                            })
                            .where({
                                "mentors.mentor": request.userId
                            })
                            .groupBy("course_enrolments.id")
                            .distinct("users.id as menteeId")
                            .then(rows => {
                                menteesCoursesReport = rows;
                                return Promise.resolve();
                            });

                        return Promise.all([menteeQ, menteesReportQ]).then(
                            queries => {
                                return Promise.resolve();
                            }
                        );
                    }
                })
                .then(() => {
                    // arranging student according to courses
                    let courses = {};
                    for (let i = 0; i < menteesCoursesReport.length; i++) {
                        const {
                            courseName,
                            courseId,
                            totalExercises,
                            ...userDetails
                        } = menteesCoursesReport[i];

                        if (courses[courseName] === undefined) {
                            courses[courseName] = {
                                courseId,
                                totalExercises,
                                studentEnrolled: []
                            };
                        }
                        courses[courseName]["studentEnrolled"].push(
                            userDetails
                        );
                    }

                    menteesCoursesReport = [];
                    for (let courseName of Object.keys(courses)) {
                        let courseReport = {
                            courseName,
                            ...courses[courseName]
                        };
                        menteesCoursesReport.push(courseReport);
                    }

                    resolve({
                        menteesCoursesReport: menteesCoursesReport,
                        mentees: mentees
                    });
                });
        });
    }

    public getMenteesExercisesReport(request, h) {
        // request.userId = 2;
        return new Promise((resolve, reject) => {
            let mentees = [],
                menteeSubmissions = [],
                exercises = {};
            database("user_roles")
                .select("*")
                .where({
                    "user_roles.userId": request.userId,
                    "user_roles.roles": "facilitator"
                })
                .then(rows => {
                    // check if he is a facilitator?
                    if (rows.length < 1) {
                        return Promise.resolve({
                            isFacilitator: false,
                            center: null
                        });
                    } else {
                        return Promise.resolve({
                            isFacilitator: true,
                            center: rows[0].center
                        });
                    }
                })
                .then(response => {
                    // if not check if he is mentor
                    if (response.isFacilitator === true) {
                        return Promise.resolve({
                            ...response
                        });
                    } else {
                        // if not then reject the Request.
                        return database("mentors")
                            .select("*")
                            .where({
                                "mentors.mentor": request.userId
                            })
                            .then(rows => {
                                if (rows.length < 1) {
                                    reject(
                                        Boom.expectationFailed(
                                            "User is niether mentor for any student " +
                                            "nor facilitator for any center"
                                        )
                                    );
                                    return Promise.reject("Rejected");
                                } else {
                                    return Promise.resolve({
                                        isFacilitator: false,
                                        center: null
                                    });
                                }
                            });
                    }
                })
                .then(response => {
                    return database("courses")
                        .select(
                            "courses.id as courseId",
                            "courses.name as courseName ",
                            "courses.type as courseType",
                            "courses.logo as courseLogo",
                            "courses.shortDescription as courseShortDescription"
                        )
                        .where({ "courses.id": request.params.courseId })
                        .then(rows => {
                            // what if the courseId doesn't exist
                            if (rows.length < 1) {
                                reject(
                                    Boom.expectationFailed(
                                        "CourseId doesn't exist please check the id."
                                    )
                                );
                                return Promise.reject("Rejected");
                            } else {
                                return Promise.resolve({
                                    ...response,
                                    courseData: rows[0]
                                });
                            }
                        });
                })
                .then(response => {
                    let menteeQ, exerciseQ;
                    if (response.isFacilitator === true) {
                        let whereClause = {
                            "user_roles.roles": "student"
                        };

                        if (response.center !== "all") {
                            whereClause["users.center"] = response.center;
                        }

                        menteeQ = database("users")
                            .select("users.id", "users.name", "users.email")
                            .innerJoin(
                                "user_roles",
                                "user_roles.userId",
                                "users.id"
                            )
                            .where(whereClause)
                            .then(rows => {
                                mentees = rows;
                                return Promise.resolve();
                            });
                    } else {
                        menteeQ = database("users")
                            .select("users.id", "users.name", "users.email")
                            .innerJoin("mentors", "mentors.mentee", "users.id")
                            .where({
                                "mentors.mentor": request.userId
                            })
                            .then(rows => {
                                mentees = rows;
                                return Promise.resolve();
                            });
                    }

                    exerciseQ = database("exercises")
                        .select(
                            "exercises.id as exerciseId",
                            "exercises.slug as exerciseSlug",
                            "exercises.content as exerciseContent",
                            "exercises.sequenceNum as exerciseSequenceNum",
                            "exercises.name as exerciseName",
                            "exercises.submissionType as exerciseSubmissionType",
                            "exercises.githubLink as exerciseGithubLink"
                        )
                        .whereNotNull("exercises.submissionType")
                        .andWhere({
                            "exercises.courseId": response.courseData.courseId
                        })
                        .orderBy("exercises.sequenceNum", "asc")
                        .then(rows => {
                            for (let i = 0; i < rows.length; i++) {
                                let exercise = rows[i];
                                exercises[exercise.exerciseId] = exercise;
                                exercises[exercise.exerciseId][
                                    "submissions"
                                ] = [];
                            }
                        });

                    return Promise.all([exerciseQ, menteeQ]).then(() => {
                        return Promise.resolve(response);
                    });
                })
                .then(response => {
                    let submissionQ;
                    if (response.isFacilitator === true) {
                        let whereClause = {
                            "user_roles.roles": "student"
                        };

                        if (response.center !== "all") {
                            whereClause["users.center"] = response.center;
                        }

                        submissionQ = database("submissions")
                            .select(
                                "submissions.id as submissionId",
                                "submissions.state as submissionState",
                                "submissions.completed as submissionCompleted",
                                "submissions.exerciseId as exerciseId",
                                "users.id as menteeId",
                                "users.name as menteeName",
                                "users.email as menteeEmail"
                            )
                            .innerJoin(
                                "exercises",
                                "exercises.id",
                                "submissions.exerciseId"
                            )
                            .innerJoin(
                                "users",
                                "users.id",
                                "submissions.userId"
                            )
                            .innerJoin(
                                "user_roles",
                                "user_roles.userId",
                                "users.id"
                            )
                            .where({
                                ...whereClause,
                                "exercises.courseId":
                                    response.courseData.courseId
                            });
                    } else {
                        submissionQ = database("submissions")
                            .select(
                                "submissions.id as submissionId",
                                "submissions.state as submissionState",
                                "submissions.completed as submissionCompleted",
                                "submissions.exerciseId as exerciseId",
                                "users.id as menteeId",
                                "users.name as menteeName",
                                "users.email as menteeEmail"
                            )
                            .innerJoin(
                                "exercises",
                                "exercises.id",
                                "submissions.exerciseId"
                            )
                            .innerJoin(
                                "mentors",
                                "mentors.mentee",
                                "submissions.userId"
                            )
                            .innerJoin("users", "users.id", "mentors.mentee")
                            .where({
                                "exercises.courseId":
                                    response.courseData.courseId,
                                "mentors.mentor": request.userId
                            });
                    }

                    submissionQ.then(rows => {
                        // arrange the submissions of users exercise wise in exercises;
                        for (let i = 0; i < rows.length; i++) {
                            let { exerciseId, ...submission } = rows[i];
                            exercises[exerciseId]["submissions"].push(
                                submission
                            );
                        }
                        // convert exercises from dictionary to list sorted by sequenceNum
                        for (let exerciseId of Object.keys(exercises)) {
                            menteeSubmissions.push(exercises[exerciseId]);
                        }
                        // sorting them sequence wise
                        menteeSubmissions.sort(function (a, b) {
                            return (
                                a.exerciseSequenceNum - b.exerciseSequenceNum
                            );
                        });

                        // console.log(exercises);
                        resolve({
                            ...response.courseData,
                            menteesExercisesReport: menteeSubmissions,
                            mentees: mentees
                        });
                    });
                });
        });
    }

    /**
     * Total submission report center wise and date wise
     * @param request 
     * @param h 
     */
    public numberOfAssignmentSubmitted(request, h) {
        return new Promise((resolve, reject) => {

            let numberOfPendingRequests, requestTodays, requestYesterday, requestLastWeek, requestLastMonth;

            let totalRecord = getforIndivisualTimePeriod(request.query.centerId, null).then((results) => {

                numberOfPendingRequests = results;
                return Promise.resolve(numberOfPendingRequests);
            });

            let todaysRecord = getforIndivisualTimePeriod(request.query.centerId, 'today').then((results) => {

                requestTodays = results;
                return Promise.resolve(requestTodays);
            });
            let yesterdayRecord = getforIndivisualTimePeriod(request.query.centerId, 'yesterday').then((results) => {

                requestYesterday = results;
                return Promise.resolve(requestYesterday);
            });
            let lastWeekRecord = getforIndivisualTimePeriod(request.query.centerId, 'lastWeek').then((results) => {

                requestLastWeek = results;
                return Promise.resolve(requestLastWeek);
            });
            let lastMonthRecord = getforIndivisualTimePeriod(request.query.centerId, 'lastMonth').then((results) => {

                requestLastMonth = results;
                return Promise.resolve(requestLastMonth);
            });


            Promise.all([totalRecord, todaysRecord, yesterdayRecord, lastWeekRecord, lastMonthRecord]).then(() => {

                let finalResult = {
                    "numberOfPendingRequests": numberOfPendingRequests.itemcounts,
                    "numberOfRequestCreated": {
                        "requestTodays": requestTodays.itemcounts,
                        "requestYesterday": requestYesterday.itemcounts,
                        "requestLastWeek": requestLastWeek.itemcounts,
                        "requestLastMonth": requestLastMonth.itemcounts,
                    }
                }
                // console.log(finalResult);
                resolve(finalResult);

            })


        });
    }


    /**
     *  generate submission report student wise and center wise
     * @param request 
     * @param h 
     */
    public numberOfAssignmentSubmittedPerUser(request, h) {
        return new Promise((resolve, reject) => {
            getNumberOfAssignmentSubmittedPerUser(request.query.centerId).then(rows => {
                // check if he is a facilitator?
                if (rows.length < 1) {
                    reject(
                        Boom.expectationFailed(
                            "no submission is pending for this center"
                        )
                    );
                } else {
                    resolve(rows);
                }
            })
        });
    }

    /**
     * This function is to send admin the total submission report in email cemter wise and all
     * @param request 
     * @param h 
     */
    public sendSubmissionReport(request, h) {


        return new Promise((resolve, reject) => {
            //  console.log("==============i am here in the new Funcion==========");
            let userWiseDharmshalaCount,
                userWiseBangaloreCount,
                userWiseAllCount,
                totalDharmshalaCount,
                totalBangaloreCount,
                totalAllCount
                ;

            request.query.centerId = 'dharamshala';
            // console.log(request.query.centerId);
            let userWsieforDharamshala = this.numberOfAssignmentSubmittedPerUser(request, h).then(result => {
                //  console.log("in side then Result:>>>>>>>>:", result);
                userWiseDharmshalaCount = result;
                return Promise.resolve(userWiseDharmshalaCount)
            });


            request.query.centerId = 'bangalore';
            // console.log(request.query.centerId);
            let userWsieforBangalore = this.numberOfAssignmentSubmittedPerUser(request, h).then(result => {
                // console.log("in side then Result:>>>>>>>>:", result);
                userWiseBangaloreCount = result;
                return Promise.resolve(userWiseBangaloreCount)
            });

            request.query.centerId = 'All';
            //console.log(request.query.centerId);
            let userWsieforAll = this.numberOfAssignmentSubmittedPerUser(request, h).then(result => {
                // console.log("in side then Result:>>>>>>>>:", result);
                userWiseAllCount = result;
                return Promise.resolve(userWiseAllCount)
            });




            request.query.centerId = 'dharamshala';
            // console.log(request.query.centerId);
            let forDharamshala = this.numberOfAssignmentSubmitted(request, h).then(result => {
                //  console.log("in side then Result:>>>>>>>>:", result);
                totalDharmshalaCount = result;
                return Promise.resolve(totalDharmshalaCount)
            });


            request.query.centerId = 'bangalore';
            // console.log(request.query.centerId);
            let forBangalore = this.numberOfAssignmentSubmitted(request, h).then(result => {
                // console.log("in side then Result:>>>>>>>>:", result);
                totalBangaloreCount = result;
                return Promise.resolve(totalBangaloreCount)
            });

            request.query.centerId = 'All';
            // console.log(request.query.centerId);
            let forAll = this.numberOfAssignmentSubmitted(request, h).then(result => {
                // console.log("in side then Result:>>>>>>>>:", result);
                totalAllCount = result;
                return Promise.resolve(totalAllCount)
            });

            Promise.all([
                userWsieforDharamshala,
                userWsieforBangalore,
                userWsieforAll,
                forDharamshala,
                forBangalore,
                forAll
            ]).then(() => {
                let student = { "email": '', "name": 'Admin' };
               
                let  scheduleConf=getScheduleConfigs();
                
                student.email =scheduleConf.receiverEmail;
               
                let result = {
                    "userWise": {
                        "dharamshala": userWiseDharmshalaCount,
                        "bangalore": userWiseBangaloreCount,
                        "all": userWiseAllCount,
                    },
                    "totalCount": {
                        "dharamshala": totalDharmshalaCount,
                        "bangalore": totalBangaloreCount,
                        "all": totalAllCount,
                    }
                }
                // for (const [key, value] of Object.entries(result.totalCount)) {

                //     console.log(key);
                //     console.log(value);
                //     console.log(value.numberOfPendingRequests)
                //     console.log(value.numberOfRequestCreated.requestYesterday)
                //     // for (let i=0; i< value.length;i++) {
                //     //     console.log(value.numberOfPendingRequests)
                //     //     console.log(value.numberOfRequestCreated.requestYesterday)
                //     // }
                // }

                let response = sendSubmissionReport(student, result);
                console.log(response);
                response.then(res => {
                    console.log(res);
                    if (res == 'sent') {
                        console.log("Email Send Successfully");
                        resolve("Email Send Successfully")
                    }
                })

            });


        });




    }
}
