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
    //             .select('users.name', 'users.id', 'users.profile_picture', 'users.facilitator')
    //             .innerJoin('users', 'course_enrolments.student_id', 'users.id')
    //             .where({
    //                 'course_enrolments.batchId': request.params.batchId,
    //                 'course_enrolments.course_id': request.params.course_id
    //             })
    //             .then((rows) => {
    //                 usersList = rows;
    //             });
    //
    //     let exercisesQuery =
    //         database('exercises')
    //             .select('id', 'parent_exercise_id', 'name', 'slug', 'sequence_num', 'review_type', 'content')
    //             .where({'course_id': request.params.course_id})
    //             .orderBy('sequence_num', 'asc')
    //             .then((rows) => {
    //                 for (let i = 0; i < rows.length; i++) {
    //                     exercisesList[rows[i].id] = rows[i];
    //                     exercisesList[rows[i].id]['completionDetails'] = {};
    //                 }
    //             });
    //
    //     Promise.all([userQuery, exercisesQuery]).then(() => {
    //         return database('submissions')
    //             .select('submissions.id', 'submissions.exercise_id', 'submissions.user_id', 'submissions.submitted_at',
    //                 'submissions.submitter_notes', 'submissions.files', 'submissions.state',
    //                 'submissions.completed', 'submissions.completed_at')
    //             .innerJoin('exercises', 'submissions.exercise_id', 'exercises.id')
    //             .where({'exercises.course_id': request.params.course_id})
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
    //                 let storedSubmission = exercisesList[submission.exercise_id]['completionDetails'][submission.user_id] || {};
    //
    //                 // No submission is stored in the object
    //                 if (Object.keys(storedSubmission).length === 0) {
    //                     exercisesList[submission.exercise_id]['completionDetails'][submission.user_id] = submission;
    //                     exercisesList[submission.exercise_id]['completionDetails'][submission.user_id]['attempts'] = 1;
    //                 }
    //                 // If the submission is stored
    //                 else {
    //                     let storedSubState = subStateOrder.indexOf(storedSubmission.state);
    //                     let attempts = exercisesList[submission.exercise_id]['completionDetails']
    //                         [submission.user_id]['attempts'] + 1;
    //                     // Replace the stored submission with the current submission if
    //                     // the stored one is of a lesser level
    //                     if (storedSubState < curSubState) {
    //                         exercisesList[submission.exercise_id]['completionDetails'][submission.user_id] = submission;
    //                     }
    //                     exercisesList[submission.exercise_id]['completionDetails'][submission.user_id]['attempts'] = attempts;
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
    //                 if (a.sequence_num < b.sequence_num) {
    //                     return -1;
    //                 } else if (a.sequence_num > b.sequence_num) {
    //                     return 1;
    //                 } else {
    //                     return 0;
    //                 }
    //             });
    //             // Nest child exercises in parent exercises
    //             let exercises = [];
    //             for (let i = 0; i < _exercises.length; i++) {
    //                 let exercise = _exercises[i];
    //                 if (exercise.sequence_num % 1 !== 0) {
    //                     let parentIndex = Number(String(exercise.sequence_num).split('.')[0]) - 1;
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
                    "submissions.exercise_id",
                    "submissions.user_id",
                    "submissions.submitted_at",
                    "submissions.submitter_notes",
                    "submissions.files",
                    "submissions.state",
                    "submissions.completed",
                    "submissions.completed_at",
                    "exercises.name"
                )
                .innerJoin(
                    "exercises",
                    "submissions.exercise_id",
                    "exercises.id"
                )
                .where({
                    "exercises.course_id": request.params.course_id,
                    "submissions.user_id": request.params.user_id
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
                            submissionsObj[submission.exercise_id] || {};

                        // No submission is stored in the object
                        if (Object.keys(storedSubmission).length === 0) {
                            submissionsObj[submission.exercise_id] = submission;
                            submissionsObj[submission.exercise_id][
                                "attempts"
                            ] = 1;
                        }
                        // If the submission is stored
                        else {
                            let storedSubState = subStateOrder.indexOf(
                                storedSubmission.state
                            );
                            let attempts =
                                submissionsObj[submission.exercise_id][
                                "attempts"
                                ] + 1;
                            // Replace the stored submission with the current submission if
                            // the stored one is of a lesser level
                            if (storedSubState < curSubState) {
                                submissionsObj[
                                    submission.exercise_id
                                ] = submission;
                            }
                            submissionsObj[submission.exercise_id][
                                "attempts"
                            ] = attempts;
                        }
                    }
                    for (let exercise_id in submissionsObj) {
                        if (submissionsObj.hasOwnProperty(exercise_id)) {
                            submissionsList.push(submissionsObj[exercise_id]);
                        }
                    }
                    resolve({
                        data: submissionsList
                    });
                });
        });
    }

    public getMenteesCoursesReport(request, h) {
        //request.user_id=175;
        return new Promise((resolve, reject) => {
            request.user_id = 1;
            let mentees = [],
                menteesCoursesReport = [];

            database("user_roles")
                .select("*")
                .where({
                    "user_roles.user_id": request.user_id,
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
                                "mentors.mentor": request.user_id
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
                    // Query to get totalExercises which has submission_type != NULL and it's submission status
                    const totalExercisesQ =
                        "COUNT(CASE WHEN exercises.submission_type " +
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
                                "user_roles.user_id",
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
                                "courses.id as course_id",
                                "course_enrolments.course_status as menteeCourseStatus",
                                database.raw(totalExercisesQ),
                                database.raw(completedSubmissionsQ),
                                // mentees details
                                "users.name as menteeName",
                                "users.email as menteeEmail"
                            )
                            .innerJoin(
                                "courses",
                                "courses.id",
                                "course_enrolments.course_id"
                            )
                            .innerJoin(
                                "users",
                                "course_enrolments.student_id",
                                "users.id"
                            )
                            .innerJoin(
                                "user_roles",
                                "user_roles.user_id",
                                "users.id"
                            )
                            .innerJoin(
                                "exercises",
                                "course_enrolments.course_id",
                                "exercises.course_id"
                            )
                            .leftJoin("submissions", function () {
                                this.on("submissions.user_id", "=", "users.id")
                                    .andOn(
                                        "submissions.exercise_id",
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
                                "mentors.mentor": request.user_id
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
                                "courses.id as course_id",
                                "course_enrolments.course_status as menteeCourseStatus",
                                database.raw(totalExercisesQ),
                                database.raw(completedSubmissionsQ),
                                // mentees details
                                "users.name as menteeName",
                                "users.email as menteeEmail"
                            )
                            .innerJoin(
                                "courses",
                                "courses.id",
                                "course_enrolments.course_id"
                            )
                            .innerJoin(
                                "mentors",
                                "course_enrolments.student_id",
                                "mentors.mentee"
                            )
                            .innerJoin("users", "users.id", "mentors.mentee")
                            .innerJoin(
                                "exercises",
                                "course_enrolments.course_id",
                                "exercises.course_id"
                            )
                            .leftJoin("submissions", function () {
                                this.on(
                                    "submissions.user_id",
                                    "=",
                                    "mentors.mentee"
                                )
                                    .andOn(
                                        "submissions.exercise_id",
                                        "=",
                                        "exercises.id"
                                    )
                                    .andOn("submissions.completed", "=", 1);
                            })
                            .where({
                                "mentors.mentor": request.user_id
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
                            course_id,
                            totalExercises,
                            ...userDetails
                        } = menteesCoursesReport[i];

                        if (courses[courseName] === undefined) {
                            courses[courseName] = {
                                course_id,
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
       console.log('--------------getMenteesExercisesReport----------------');
       //request.user_id = 175;
        return new Promise((resolve, reject) => {
            let mentees = [],
                menteeSubmissions = [],
                exercises = {};
            database("user_roles")
                .select("*")
                .where({
                    "user_roles.user_id": request.user_id,
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
                                "mentors.mentor": request.user_id
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
                            "courses.id as course_id",
                            "courses.name as courseName ",
                            "courses.type as courseType",
                            "courses.logo as courseLogo",
                            "courses.short_description as courseShortDescription"
                        )
                        .where({ "courses.id": request.params.course_id })
                        .then(rows => {
                            // what if the course_id doesn't exist
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
                                "user_roles.user_id",
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
                                "mentors.mentor": request.user_id
                            })
                            .then(rows => {
                                mentees = rows;
                                return Promise.resolve();
                            });
                    }

                    exerciseQ = database("exercises")
                        .select(
                            "exercises.id as exercise_id",
                            "exercises.slug as exerciseSlug",
                            "exercises.content as exerciseContent",
                            "exercises.sequence_num as exerciseSequenceNum",
                            "exercises.name as exerciseName",
                            "exercises.submission_type as exerciseSubmissionType",
                            "exercises.github_link as exerciseGithubLink"
                        )
                        .whereNotNull("exercises.submission_type")
                        .andWhere({
                            "exercises.course_id": response.courseData.course_id
                        })
                        .orderBy("exercises.sequence_num", "asc")
                        .then(rows => {
                            for (let i = 0; i < rows.length; i++) {
                                let exercise = rows[i];
                                exercises[exercise.exercise_id] = exercise;
                                exercises[exercise.exercise_id][
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
                                "submissions.submitter_notes as submitter_notes",
                                "submissions.completed as submissionCompleted",
                                "submissions.exercise_id as exercise_id",
                                "users.id as menteeId",
                                "users.name as menteeName",
                                "users.email as menteeEmail"
                            )
                            .innerJoin(
                                "exercises",
                                "exercises.id",
                                "submissions.exercise_id"
                            )
                            .innerJoin(
                                "users",
                                "users.id",
                                "submissions.user_id"
                            )
                            .innerJoin(
                                "user_roles",
                                "user_roles.user_id",
                                "users.id"
                            )
                            .where({
                                ...whereClause,
                                "exercises.course_id":
                                    response.courseData.course_id
                            });
                            console.log();
                    } else {
                        submissionQ = database("submissions")
                            .select(
                                "submissions.id as submissionId",
                                "submissions.submitter_notes as submitter_notes",
                                "submissions.state as submissionState",
                                "submissions.completed as submissionCompleted",
                                "submissions.exercise_id as exercise_id",
                                "users.id as menteeId",
                                "users.name as menteeName",
                                "users.email as menteeEmail"
                            )
                            .innerJoin(
                                "exercises",
                                "exercises.id",
                                "submissions.exercise_id"
                            )
                            .innerJoin(
                                "mentors",
                                "mentors.mentee",
                                "submissions.user_id"
                            )
                            .innerJoin("users", "users.id", "mentors.mentee")
                            .where({
                                "exercises.course_id":
                                    response.courseData.course_id,
                                "mentors.mentor": request.user_id
                            });
                    }

                    submissionQ.then(rows => {
                        // arrange the submissions of users exercise wise in exercises;
                        for (let i = 0; i < rows.length; i++) {
                            let { exercise_id, ...submission } = rows[i];
                            exercises[exercise_id]["submissions"].push(
                                submission
                            );
                        }
                        // convert exercises from dictionary to list sorted by sequence_num
                        for (let exercise_id of Object.keys(exercises)) {
                            menteeSubmissions.push(exercises[exercise_id]);
                        }
                        // sorting them sequence wise
                        menteeSubmissions.sort(function (a, b) {
                            return (
                                a.exerciseSequenceNum - b.exerciseSequenceNum
                            );
                        });

                        // 
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
                    "numberOfPendingRequests": numberOfPendingRequests.itemCounts,
                    "numberOfRequestCreated": {
                        "requestTodays": requestTodays.itemCounts,
                        "requestYesterday": requestYesterday.itemCounts,
                        "requestLastWeek": requestLastWeek.itemCounts,
                        "requestLastMonth": requestLastMonth.itemCounts,
                    }
                }
                // 
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
                    resolve([{
                        name: "No Students",
                        numberOfAssignmentSubmitted:"No assignment have been submitted"
                    }])
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
            //  
            let userWiseDharmshalaCount,
                userWiseBangaloreCount,
                userWiseAllCount,
                totalDharmshalaCount,
                totalBangaloreCount,
                totalAllCount
                ;

            request.query.centerId = 'dharamshala';
            // 
            let userWsieforDharamshala = this.numberOfAssignmentSubmittedPerUser(request, h).then(result => {
                //  
                userWiseDharmshalaCount = result;
                return Promise.resolve(userWiseDharmshalaCount)
            });


            request.query.centerId = 'bangalore';
            // 
            let userWsieforBangalore = this.numberOfAssignmentSubmittedPerUser(request, h).then(result => {
                // 
                userWiseBangaloreCount = result;
                return Promise.resolve(userWiseBangaloreCount)
            });

            request.query.centerId = 'All';
            //
            let userWsieforAll = this.numberOfAssignmentSubmittedPerUser(request, h).then(result => {
                // 
                userWiseAllCount = result;
                return Promise.resolve(userWiseAllCount)
            });




            request.query.centerId = 'dharamshala';
            // 
            let forDharamshala = this.numberOfAssignmentSubmitted(request, h).then(result => {
                //  
                totalDharmshalaCount = result;
                return Promise.resolve(totalDharmshalaCount)
            });


            request.query.centerId = 'bangalore';
            // 
            let forBangalore = this.numberOfAssignmentSubmitted(request, h).then(result => {
                // 
                totalBangaloreCount = result;
                return Promise.resolve(totalBangaloreCount)
            });

            request.query.centerId = 'All';
            // 
            let forAll = this.numberOfAssignmentSubmitted(request, h).then(result => {
                // 
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
                
                let scheduleConf = getScheduleConfigs();
                
                student.email = scheduleConf.receiverEmail;

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
                let response = sendSubmissionReport(student, result);
                response.then(res => {
                    if (res == 'sent') {
                        resolve("Email Send Successfully")
                    }
                })
            });
        });




    }
}
