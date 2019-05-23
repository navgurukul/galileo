import * as Hapi from "hapi";
import * as Boom from "boom";
import {
    manipulateResultSet,
    isStudentEligibleToEnroll,
    calculatePercentageOfaCourse
} from "../../helpers/courseHelper";
// import * as GoogleCloudStorage from "@google-cloud/storage";
import * as Configs from "../../configurations";
import database from "../../";
import { IServerConfigurations } from "../../configurations/index";

import {
    sendAssignmentReviewPendingEmail,
    sendAssignmentReviewCompleteEmail,
    sendCoursesUnlockedForUserEmail
} from "../../sendEmail";
import {
    sendCliqIntimation,
    sendCliqIntimationTest,
    sendCliqIntimationMessagetest
} from "../../cliq";
import * as fs from "fs";
let ejs = require('ejs')

var _ = require("underscore");

// Helper function to generate UIDs
function generateUID() {
    // I generate the UID from two parts here
    // to ensure the random number provide enough bits.
    let firstPart = ((Math.random() * 46656) | 0).toString(36);
    let secondPart = ((Math.random() * 46656) | 0).toString(36);
    firstPart = ("000" + firstPart).slice(-3);
    secondPart = ("000" + secondPart).slice(-3);
    return firstPart + secondPart;
}

// TODO: Add support for tracking assignmnt completion time.

export default class AssignmentController {
    private configs: IServerConfigurations;
    private database: any;

    constructor(configs: IServerConfigurations, database: any) {
        this.database = database;
        this.configs = configs;
    }

    public postExerciseSubmission(request, h) {
        return new Promise((resolve, reject) => {
            //  request.userId = 83;



            database("course_enrolments")
                .select("*")
                .where({
                    studentId: request.userId,
                    courseId: request.params.courseId
                })
                .then(rows => {
                    /**
                     * student can only submit the assignment of the courses in which they are enrolled.
                     */
                    if (rows.length > 0) {
                        return Promise.resolve({ canSubmit: true });
                    } else {
                        reject(
                            Boom.expectationFailed(
                                "User can't submit an assignment unless enrolled in course"
                            )
                        );
                        return Promise.resolve({ canSubmit: false });
                    }
                })
                .then(response => {
                    if (response.canSubmit === true) {
                        let count, student, reviewer;
                        /** Validate the exerciseId does the exercise exist or not not */
                        database("exercises")
                            .select()
                            .where("id", request.params.exerciseId)
                            .then(rows => {
                                if (rows.length < 1) {
                                    reject(
                                        Boom.notFound(
                                            "The exercise with the given ID is not found."
                                        )
                                    );
                                    return Promise.reject("Rejected");
                                } else {
                                    return Promise.resolve(rows[0]);
                                }
                            })
                            .then(exercise => {
                                return database("submissions")
                                    .count("id as count")
                                    .where({
                                        "submissions.userId": request.userId,
                                        exerciseId: request.params.exerciseId
                                    })
                                    .then(rows => {
                                        count = rows[0].count;
                                        return Promise.resolve(exercise);
                                    });
                            })
                            .then(exercise => {
                                // let facilitatorIdQuery;

                                /** Not in work */
                                if (exercise.reviewType === "manual") {
                                    return Promise.resolve({
                                        exerciseId: request.params.exerciseId,
                                        userId: request.userId,
                                        completed: 1,
                                        state: "completed",
                                        completedAt: new Date()
                                    });
                                } else if (
                                    exercise.reviewType === "automatic"
                                ) {
                                    /** Not in work */
                                    return Promise.resolve({
                                        exerciseId: request.params.exerciseId,
                                        userId: request.userId,
                                        submitterNotes: request.payload.notes,
                                        // files: JSON.stringify(request.payload.files),
                                        state: "completed",
                                        completed: 1,
                                        completedAt: new Date()
                                    });
                                } else if (
                                    exercise.reviewType === "peer" ||
                                    exercise.reviewType === "facilitator"
                                ) {
                                    let reviewerIdQuery, facilitatorIdQuery;

                                    /** Finding the facilitator of the student center */
                                    facilitatorIdQuery = database("users")
                                        .select("users.center as studentCenter")
                                        .where({
                                            "users.id": request.userId
                                        })
                                        .then(rows => {
                                            /** Find the student center. */
                                            if (rows.length < 1) {
                                                reject(
                                                    Boom.expectationFailed(
                                                        "Student have no center assigned can't" +
                                                        "submit assignment."
                                                    )
                                                );
                                                return Promise.reject(
                                                    "Rejected"
                                                );
                                            } else {
                                                const {
                                                    studentCenter
                                                } = rows[0];
                                                return Promise.resolve(
                                                    studentCenter
                                                );
                                            }
                                        })
                                        .then(studentCenter => {
                                            /** Find the facilitor of the student. */
                                            return database("user_roles")
                                                .select("userId as reviewerID")
                                                .where({
                                                    "user_roles.center": studentCenter,
                                                    "user_roles.roles":
                                                        "facilitator"
                                                });
                                        })
                                        .then(rows => {
                                            if (rows.length < 1) {
                                                const {
                                                    facilitatorEmails
                                                } = this.configs;

                                                /**
                                                 * If there is no facilitator then assign the assigment
                                                 * to the default Facilitator.
                                                 */
                                                if (
                                                    facilitatorEmails.length < 1
                                                ) {
                                                    reject(
                                                        Boom.expectationFailed(
                                                            "No facilitators in config add them."
                                                        )
                                                    );
                                                    return Promise.reject(
                                                        "Rejected"
                                                    );
                                                }

                                                const index =
                                                    (Math.random() *
                                                        facilitatorEmails.length) |
                                                    0;

                                                let facilitatorEmail =
                                                    facilitatorEmails[index];

                                                return database("users")
                                                    .select(
                                                        "users.id as reviewerID"
                                                    )
                                                    .where({
                                                        "users.email": facilitatorEmail
                                                    });
                                            } else {
                                                return Promise.resolve(rows);
                                            }
                                        })
                                        .then(rows => {
                                            // if no facilitator exist than just
                                            // throw error of no facilitator found for the center.
                                            if (rows.length < 1) {
                                                reject(
                                                    Boom.expectationFailed(
                                                        "There is no facilitator " +
                                                        "added on the platform."
                                                    )
                                                );
                                                return Promise.reject(
                                                    "Rejected"
                                                );
                                            } else {
                                                return Promise.resolve(rows);
                                            }
                                        });
                                    /**
                                     * if any student has already completed the assignment,
                                     * then assign the assignment to the student.
                                     */
                                    if (exercise.reviewType === "peer") {
                                        reviewerIdQuery = database(
                                            "submissions"
                                        )
                                            .select(
                                                "submissions.userId as reviewerID"
                                            )
                                            .innerJoin(
                                                "course_enrolments",
                                                "submissions.userId",
                                                "course_enrolments.studentId"
                                            )
                                            .where({
                                                "submissions.completed": 1,
                                                "submissions.exerciseId":
                                                    request.params.exerciseId,
                                                "course_enrolments.courseId":
                                                    request.params.courseId
                                            })
                                            .orderByRaw("RAND()")
                                            .limit(1);
                                    } else {
                                        reviewerIdQuery = facilitatorIdQuery;
                                    }

                                    return reviewerIdQuery
                                        .then(rows => {
                                            /** extracting the reviewerId */
                                            let reviewerId;
                                            if (
                                                rows.length < 1 &&
                                                exercise.reviewType === "peer"
                                            ) {
                                                return facilitatorIdQuery.then(
                                                    rows => {
                                                        reviewerId =
                                                            rows[0].reviewerID;
                                                        return Promise.resolve({
                                                            reviewerId: reviewerId
                                                        });
                                                    }
                                                );
                                            } else {
                                                let reviewerId =
                                                    rows[0].reviewerID;
                                                return Promise.resolve({
                                                    reviewerId: reviewerId
                                                });
                                            }
                                        })
                                        .then(response => {
                                            return Promise.resolve({
                                                exerciseId:
                                                    request.params.exerciseId,
                                                userId: request.userId,
                                                submitterNotes:
                                                    request.payload.notes,
                                                // files: JSON.stringify(request.payload.files),
                                                state: "pending",
                                                completed: 0,
                                                peerReviewerId:
                                                    response.reviewerId
                                            });
                                        });
                                }
                            })
                            .then(queryData => {
                                /**
                                 * Create a new submission if there doesn't exist one
                                 * or if exist update it as a complete new assignment.
                                 */
                                let submissionInsertQuery;
                                if (count >= 1) {
                                    // update the existing submssion.
                                    submissionInsertQuery = database(
                                        "submissions"
                                    )
                                        .select(`submissions.id`)
                                        .where({
                                            "submissions.userId":
                                                request.userId,
                                            exerciseId:
                                                request.params.exerciseId
                                        })
                                        .update(queryData)
                                        .then(row => {
                                            return Promise.resolve({
                                                reviewerId:
                                                    queryData.peerReviewerId,
                                                studentId: queryData.userId
                                            });
                                        });
                                } else {
                                    // create a new submission.
                                    submissionInsertQuery = database(
                                        "submissions"
                                    )
                                        .insert(queryData)
                                        .then(rows => {
                                            return Promise.resolve({
                                                reviewerId:
                                                    queryData.peerReviewerId,
                                                studentId: queryData.userId
                                            });
                                        });
                                }

                                submissionInsertQuery
                                    .then(response => {
                                        /**
                                         * Finding the student and the reviewer details to send the
                                         * email to them about assignment submission.
                                         */
                                        let studentQuery = database("users")
                                            .select("users.email", "users.name")
                                            .where({
                                                "users.id": response.studentId
                                            })
                                            .then(rows => {
                                                student = rows[0];
                                                return Promise.resolve();
                                            });

                                        let reviewerQuery = database("users")
                                            .select("users.email", "users.name")
                                            .where({
                                                "users.id": response.reviewerId
                                            })
                                            .then(rows => {
                                                reviewer = rows[0];
                                                return Promise.resolve();
                                            });

                                        return Promise.all([
                                            studentQuery,
                                            reviewerQuery
                                        ]).then(() => {
                                            return database("submissions")
                                                .select(
                                                    // Submissions table fields
                                                    "submissions.id as submissionId",
                                                    "exercises.name as exerciseName",
                                                    "exercises.slug as exerciseSlug",
                                                    "submissions.state",
                                                    "submissions.completed"
                                                )
                                                .innerJoin(
                                                    "exercises",
                                                    "exercises.id",
                                                    "submissions.exerciseId"
                                                )
                                                .where({
                                                    "submissions.userId":
                                                        request.userId,
                                                    exerciseId:
                                                        request.params
                                                            .exerciseId
                                                });
                                        });
                                    })
                                    .then(rows => {
                                        // send email using aws to the student and the reviewer--
                                        // sendAssignmentReviewPendingEmail(
                                        //     student,
                                        //     reviewer,
                                        //     rows[0]
                                        // );

                                        // let reviewerObject = {
                                        //     "receiverId": reviewer.email,
                                        //     "message": `${student.name} as submitted his assignment. Please review it http://saral.navgurukul.org/assignment-review?submissionId=${rows[0].submissionId}`
                                        // }
                                        // let studentObject = {
                                        //     "receiverId": student.email,
                                        //     "message": `${reviewer.name} has been intimated for your assignment review`
                                        // }


                                        // sendCliqIntimation(reviewerObject).then(result => {

                                        // })
                                        // sendCliqIntimation(studentObject).then(result => {

                                        // })

                                        

                                        let reviewerObject = {
                                            "receiverEmail": reviewer.email,
                                            "messageArgs": {
                                                "reviewerName": reviewer.name,
                                                "submitterName": student.name
                                            }
                                        }

                                        sendCliqIntimationMessagetest('newPeerReviewRequest', reviewerObject).then(result => {

                                        })

                                        resolve(rows[0]);
                                    });
                            });
                    }
                });
        });
    }

    public uploadExerciseAssignment(request, h) {
        // NEEd to be rewritten for s3: TODO
        // let gcs = GoogleCloudStorage({
        //     projectId: this.configs.googleCloud.projectId,
        //     keyFilename: __dirname + '/../' + this.configs.googleCloud.keyFilename
        // });
        // let bucket = gcs.bucket(this.configs.googleCloud.assignmentsBucket);
        // var fileData = request.payload.file;
        // if (fileData) {
        //     let dir = request.userId + '/' + request.params.courseId + '/' + request.params.exerciseId;
        //     let name = generateUID() + '.' + fileData.hapi.filename;
        //     let filePath = dir + '/' + name;
        //     let file = bucket.file(filePath);
        //     let stream = file.createWriteStream({
        //         metadata: {
        //             contentType: fileData.hapi.headers['content-type']
        //         }
        //     });
        //     stream.on('error', (err) => {
        //         
        //         return reply(Boom.badImplementation("There was some problem uploading the file. Please try again."));
        //     });
        //     stream.on('finish', () => {
        //         return reply({
        //             "success": true,
        //             "filePath": "https://storage.googleapis.com/" + this.configs.googleCloud.assignmentsBucket + '/' + filePath
        //         });
        //     });
        //     stream.end(fileData._data);
        // }
    }

    public getExerciseSubmissions(request, h) {


        return new Promise((resolve, reject) => {
            // query to find all the submission of particular exerciseId
            let submissionQuery = database("submissions")
                .select(
                    // Submissions table fields
                    "submissions.id",
                    "submissions.exerciseId",
                    "submissions.submittedAt",
                    "submissions.submitterNotes",
                    "submissions.files",
                    "submissions.notesReviewer",
                    "submissions.state",
                    "submissions.completed",
                    "submissions.completedAt",
                    // Reviewer details
                    "reviewUsers.name as reviewerName",
                    "reviewUsers.id as reviewerId",
                    "reviewUsers.profilePicture as reviewerProfilePicture",
                    // 'reviewUsers.facilitator as isReviewerFacilitator',
                    // Submitter Details
                    "users.name as submitterName",
                    "users.id as submitterId",
                    "users.profilePicture as submitterProfilePicture"
                    // 'users.facilitator as isSubmitterFacilitator'
                )
                .leftJoin(
                    database.raw("users reviewUsers"),
                    "submissions.peerReviewerId",
                    "reviewUsers.id"
                )
                .leftJoin("users", "submissions.userId", "users.id");

            // Clauses to search the exercisesId
            let whereClause = {
                "submissions.exerciseId": request.params.exerciseId
            };

            // Wether to search submissions of the current user or not.
            if (request.query.submissionUsers === "current") {
                whereClause["submissions.userId"] = request.userId;
            }

            // the state of the submissions of the student.
            if (request.query.submissionState !== "all") {
                whereClause["submissions.state"] =
                    request.query.submissionState;
            }

            submissionQuery.where(whereClause).then(rows => {
                // parsing the files
                let submissions = [];
                for (let i = 0; i < rows.length; i++) {
                    let submission = rows[i];
                    if (submission.files !== null) {
                        submission.files = JSON.parse(submission.files);
                    }
                    submissions.push(submission);
                }

                resolve({ data: submissions });
            });
        });
    }

    public getExerciseSubmissionById(request, h) {
        return new Promise((resolve, reject) => {
            // for searching single assignment submission by submissionId
            database("submissions")
                .select(
                    "submissions.id",
                    "submissions.exerciseId",
                    "submissions.userId",
                    "submissions.submittedAt",
                    "submissions.submitterNotes",
                    "submissions.files",
                    "submissions.notesReviewer",
                    "submissions.state",
                    "submissions.completed",
                    "submissions.completedAt",
                    "submissions.submittedAt",
                    "users.name as reviewerName",
                    "users.id as reviewerId",
                    "users.profilePicture as reviewerProfilePicture"
                )
                .leftJoin("users", "submissions.peerReviewerId", "users.id")
                .where({ "submissions.id": request.params.submissionId })
                .then(rows => {
                    let submission = rows[0];
                    if (submission.files !== null) {
                        submission.files = JSON.parse(submission.files);
                    }
                    resolve(submission);
                });
        });
    }

    public getPeerReviewRequests(request, h) {
        return new Promise((resolve, reject) => {
            // Hackish Solution to show all the review to the Developer.
            //request.userId = 29;
            let developerEmails = [
                "amar17@navgurukul.org",
                "diwakar17@navgurukul.org",
                "a@navgurukul.org"
                // 'lalita17@navgurukul.org',
                // 'kanika17@navgurukul.org',
                // 'rani17@navgurukul.org',
                // 'khusboo17@navgurukul.org',
            ];

            database("users")
                .select("users.email")
                .where({ "users.id": request.userId })
                .then(rows => {
                    if (developerEmails.indexOf(rows[0].email) > -1) {
                        // Show all the Peer Review to the user when the User is Developer.
                        return Promise.resolve({
                            whereClause: {}
                        });
                    }
                    // if not a developer show him the assignmnt assign to him for reviewing
                    return Promise.resolve({
                        whereClause: {
                            "submissions.peerReviewerId": request.userId
                        }
                    });
                })
                // *************** Hackish solution till here ********************.

                .then(response => {
                    database("submissions")
                        .select(
                            // Submissions table
                            "submissions.id",
                            "submissions.exerciseId",
                            "submissions.submittedAt",
                            "submissions.submitterNotes",
                            "submissions.files",
                            "submissions.notesReviewer",
                            "submissions.state",
                            "submissions.completed",
                            "submissions.completedAt",
                            "submissions.submittedAt",
                            // Exercises Table
                            "exercises.id as exerciseId",
                            "exercises.parentExerciseId as parentExerciseId",
                            "exercises.courseId",
                            "exercises.name as exerciseName",
                            "exercises.slug as exerciseSlug",
                            "exercises.sequenceNum as exerciseSequenceNum",
                            "exercises.reviewType",
                            "exercises.content as exerciseContent",
                            // Users table
                            "users.id as submitterId",
                            "users.name as submitterName",
                            "users.profilePicture as submitterProfilePicture"
                            // 'users.facilitator as isSubmitterFacilitator'
                        )
                        .innerJoin(
                            "exercises",
                            "submissions.exerciseId",
                            "exercises.id"
                        )
                        .innerJoin("users", "submissions.userId", "users.id")
                        .where(response.whereClause)
                        .orderBy("submittedAt", "desc")
                        // 
                        .then(rows => {

                            let submissions = [];
                            for (let i = 0; i < rows.length; i++) {
                                let submission = rows[i];
                                if (submission.files !== null) {
                                    submission.files = JSON.parse(
                                        submission.files
                                    );
                                }
                                submissions.push(submission);
                            }
                            // 
                            resolve({ data: submissions });
                        });
                });
        });
    }

    public editPeerReviewRequest(request, h) {
        //const usersId = 29;
     //   request.userId = 29;
        let isAssigmentApproved = false;
        let initialAvailableCourses;
        let availableCoursesPostAssigmentApproval;
        let courseId;
        return new Promise((resolve, reject) => {
            // submitting the review of the submitted assignment

            database("submissions")
                .select(
                    "submissions.id",
                    "submissions.userId",
                    "submissions.state",
                    "submissions.peerReviewerId",
                    "submissions.exerciseId",
                    "submissions.Id",
                    "mentors.mentor",
                    "users.center"
                )
                .leftJoin("mentors", "userId", "mentee")
                .innerJoin("users", "submissions.userId", "users.id")
                .where({ "submissions.id": request.params.submissionId })
                .then(rows => {
                    // validate the submissionId
                    if (rows.length < 1) {
                        reject(
                            Boom.notFound(
                                "A submission with the given ID does not exist."
                            )
                        );
                        return Promise.reject("Rejected");
                    }
                    let submission = rows[0];
                    //
                    // submissions once reviewed shouldn't be reviewed again.
                    return Promise.resolve(submission);
                })
                .then((submission) => {
                    database('exercises').select('courseId').where({ 'exercises.id': submission.exerciseId }).then((rows) => {

                        courseId = rows[0].courseId;
                        //
                        return Promise.resolve(courseId);
                    }).then(courseId => {
                        
                        //
                        database("course_enrolments")
                            .select("*")
                            .where({
                                studentId: request.userId,
                                courseId: courseId
                            })
                            .then(rows => {
                                
                                if (rows.length > 0) {
                                    return Promise.resolve({
                                        isAlreadyEnrolled: true,
                                        courseId: courseId
                                    });
                                } else {
                                    reject(
                                        Boom.expectationFailed(
                                            "the user is not enrolled in this course"
                                        )
                                    );
                                    return Promise.resolve({
                                        isAlreadyEnrolled: false,
                                        courseId: courseId
                                    });
                                }
                            })
                            .then(response => {
                                if (response.isAlreadyEnrolled) {
                                    database("submissions")
                                        .select("submissions.id",
                                            "submissions.userId",
                                            "submissions.state",
                                            "submissions.peerReviewerId",
                                            "submissions.Id",
                                            "mentors.mentor",
                                            "users.center")
                                        .leftJoin("mentors", "userId", "mentee")
                                        .innerJoin(
                                            "users",
                                            "submissions.userId",
                                            "users.id"
                                        )
                                        .where({
                                            "submissions.id":
                                                request.params.submissionId
                                        })
                                        .then(rows => {
                                            //moved the check for validaity of submission Id to top section

                                            let submission = rows[0];
                                            // submissions once reviewed shouldn't be reviewed again.
                                            if (submission.state !== "pending") {
                                                reject(
                                                    Boom.expectationFailed(
                                                        "The given submission has already been reviewed."
                                                    )
                                                );
                                                return Promise.reject("Rejected");
                                            }
                                            return Promise.resolve(submission);
                                        })
                                        .then(submission => {


                                            let updateFields = {
                                                notesReviewer: request.payload.notes
                                            };
                                            return database("user_roles")
                                                .select("*")
                                                .where({
                                                    roles: "facilitator"
                                                })
                                                .whereIn(
                                                    "center",
                                                    [submission.center, "all"] // or where the center is all
                                                )
                                                .then(rows => {
                                                    let usersId = request.userId;

                                                    let usersFacilatorId = rows[0]
                                                        ? rows[0].userId
                                                        : null;
                                                    //

                                                    if (
                                                        usersId ===
                                                        submission.peerReviewerId ||
                                                        usersId ===
                                                        submission.mentor ||
                                                        usersId === usersFacilatorId
                                                    ) {
                                                        if (
                                                            request.payload.approved
                                                        ) {
                                                            isAssigmentApproved = true;
                                                            updateFields[
                                                                "completed"
                                                            ] = 1;
                                                            updateFields["state"] =
                                                                "completed";
                                                            updateFields[
                                                                "completedAt"
                                                            ] = new Date();
                                                            updateFields[
                                                                "markCompletedBy"
                                                            ] = usersId;
                                                        } else {
                                                            updateFields[
                                                                "completed"
                                                            ] = 0;
                                                            updateFields["state"] =
                                                                "rejected";
                                                            updateFields[
                                                                "markCompletedBy"
                                                            ] = usersId;
                                                        }
                                                    } else {
                                                        reject(
                                                            Boom.notFound(
                                                                "User is not authorize to do so."
                                                            )
                                                        );
                                                        return Promise.reject(
                                                            "Rejected"
                                                        );
                                                    }

                                                    return Promise.resolve({
                                                        updateFields,
                                                        submission
                                                    });
                                                });
                                        })
                                        .then(({ updateFields, submission }) => {
                                            if (isAssigmentApproved) {
                                                //
                                                this.checkDependencyCourses(
                                                    request.userId
                                                ).then(courses => {
                                                    initialAvailableCourses = courses;
                                                    database("submissions")
                                                        .update(updateFields)
                                                        .where({
                                                            id:
                                                                request.params
                                                                    .submissionId
                                                        })
                                                        .then(rows => {// this portion

                                                            this.markCourseCompleted(submission.userId, courseId);


                                                            this.checkDependencyCourses(
                                                                request.userId
                                                            ).then(courses => {
                                                                availableCoursesPostAssigmentApproval = courses;
                                                                this.checkIfDependencyCourseUnlocked(
                                                                    initialAvailableCourses,
                                                                    availableCoursesPostAssigmentApproval,
                                                                    request.userId,
                                                                    courseId
                                                                );
                                                                /*  Finding the student and the reviewer details to send email
                                                                 * to them about the assignment review.
                                                                 */
                                                                let student,
                                                                    reviewer;
                                                                let studentQ = database(
                                                                    "users"
                                                                )
                                                                    .select("*")
                                                                    .where({
                                                                        "users.id":
                                                                            submission.userId
                                                                    })
                                                                    .then(rows => {
                                                                        student =
                                                                            rows[0];
                                                                        return Promise.resolve();
                                                                    });

                                                                let reviewerQ = database(
                                                                    "users"
                                                                )
                                                                    .select("*")
                                                                    .where({
                                                                        "users.id":
                                                                            submission.peerReviewerId
                                                                    })
                                                                    .then(rows => {
                                                                        reviewer =
                                                                            rows[0];
                                                                        return Promise.resolve();
                                                                    });

                                                                return Promise.all([
                                                                    studentQ,
                                                                    reviewerQ
                                                                ]).then(() => {
                                                                    // send email for submission review completion
                                                                    return database(
                                                                        "submissions"
                                                                    )
                                                                        .select(
                                                                            "exercises.courseId",
                                                                            "exercises.slug",
                                                                            "exercises.name"
                                                                        )
                                                                        .innerJoin(
                                                                            "exercises",
                                                                            "exercises.id",
                                                                            "submissions.exerciseId"
                                                                        )
                                                                        .where({
                                                                            "submissions.id":
                                                                                submission.id
                                                                        })
                                                                        .then(
                                                                            rows => {
                                                                                // let studentObject = {
                                                                                //     "receiverId": student.name,
                                                                                //     "message": `Hi ${student.name}, Apka assignment ${reviewer.name} ne check kardiya ha.` +
                                                                                //         `App ushe ish link par dekh sakte ho http://saral.navgurukul.org/course?id=${rows[0].courseId}&slug=${rows[0].slug}`
                                                                                // }


                                                                                // // sendAssignmentReviewCompleteEmail(
                                                                                // //     student,
                                                                                // //     reviewer,
                                                                                // //     rows[0]
                                                                                // // );
                                                                                // return sendCliqIntimation(studentObject).then(result => {

                                                                                // })
                                                                              
                                                                                let menteeObject = {
                                                                                    "receiverEmail": reviewer.email,
                                                                                    "messageArgs": {
                                                                                        "submitterName": student.name,
                                                                                        "reviewerName": reviewer.name,
                                                                                        "courseId": rows[0].courseId,
                                                                                        "exercieseSlug": rows[0].slug
                                                                                    }
                                                                                }

                                                                                sendCliqIntimationMessagetest('assignmentApproved', menteeObject).then(result => {

                                                                                })




                                                                            }
                                                                        );
                                                                });
                                                            });
                                                        })
                                                        .then(() => {
                                                            resolve({
                                                                success: true
                                                            });
                                                        });
                                                });
                                            } else {
                                                //

                                                // Updating the submission with the reviewers review.
                                                database("submissions")
                                                    .update(updateFields)
                                                    .where({
                                                        id:
                                                            request.params
                                                                .submissionId
                                                    })
                                                    .then(rows => {
                                                        /**
                                                         *  Finding the student and the reviewer details to send email
                                                         * to them about the assignment review.
                                                         */

                                                      
                                                        let student, reviewer;
                                                        let studentQ = database(
                                                            "users"
                                                        )
                                                            .select("*")
                                                            .where({
                                                                "users.id":
                                                                    submission.userId
                                                            })
                                                            .then(rows => {
                                                                student = rows[0];
                                                                return Promise.resolve();
                                                            });

                                                        let reviewerQ = database(
                                                            "users"
                                                        )
                                                            .select("*")
                                                            .where({
                                                                "users.id":
                                                                    submission.peerReviewerId
                                                            })
                                                            .then(rows => {
                                                                reviewer = rows[0];
                                                                return Promise.resolve();
                                                            });

                                                        return Promise.all([
                                                            studentQ,
                                                            reviewerQ
                                                        ]).then(() => {
                                                            // send email for submission review completion
                                                            return database(
                                                                "submissions"
                                                            )
                                                                .select(
                                                                    "exercises.courseId",
                                                                    "exercises.slug",
                                                                    "exercises.name"
                                                                )
                                                                .innerJoin(
                                                                    "exercises",
                                                                    "exercises.id",
                                                                    "submissions.exerciseId"
                                                                )
                                                                .where({
                                                                    "submissions.id":
                                                                        submission.id
                                                                })
                                                                .then(rows => {
                                                                    // let studentObject = {
                                                                    //     "receiverId": student.name,
                                                                    //     "message": `Hi ${student.name}, Apka assignment ${reviewer.name} ne check kardiya ha.` +
                                                                    //         `App ushe ish link par dekh sakte ho http://saral.navgurukul.org/course?id=${rows[0].courseId}&slug=${rows[0].slug}`
                                                                    // }

                                                                    // return sendCliqIntimation(studentObject).then(result => {

                                                                    // })
                                                                  

                                                                    let menteeObject = {
                                                                        "receiverEmail": reviewer.email,
                                                                        "messageArgs": {
                                                                            "submitterName": student.name,
                                                                            "reviewerName": reviewer.name,
                                                                            "courseId": rows[0].courseId,
                                                                            "exercieseSlug": rows[0].slug
                                                                        }
                                                                    }

                                                                    sendCliqIntimationMessagetest('assignmentRejected', menteeObject).then(result => {

                                                                    })
                                                                    //     return sendAssignmentReviewCompleteEmail(
                                                                    //         student,
                                                                    //         reviewer,
                                                                    //         rows[0]
                                                                    //     );
                                                                });
                                                        });
                                                    })
                                                    .then(() => {
                                                        resolve({ success: true });
                                                    });
                                            }
                                        });
                                }
                            });
                    });
                })

            // submitting the review of the submitted assiugnment
        });
    }

    public checkDependencyCourses(userId) {
        //let TotalExercisesPerCourseQ, exerciseCompeletedPerCourseQ, courseReliesOnQ, availableQ;
        var availableCourses = [];
        let mergedResult = {};
        let totalExercisesPerCourse = [];
        let exerciseCompeletedPerCourse = [];
        let allAvailableCourses = [];
        let courseReliesOn = [];
        let courseConfig = Configs.getCourseConfigs();

        return new Promise((resolve, reject) => {
            database("courses")
                .select(
                    "courses.id",
                    "courses.name",
                    "courses.type",
                    "courses.logo",
                    "courses.shortDescription",
                    "courses.sequenceNum"
                )
                .where(
                    "courses.id",
                    "not in",
                    database("courses")
                        .distinct()
                        .select("courses.id")
                        .join("course_enrolments", function () {
                            this.on(
                                "courses.id",
                                "=",
                                "course_enrolments.courseId"
                            ).andOn("course_enrolments.studentId", "=", userId);
                        })
                )
                .then(rows => {
                    //allAvailableCourses = rows;
                    mergedResult["allAvailableCourses"] = rows;
                    return Promise.resolve(mergedResult);
                })
                .then(mergedResult => {
                    database("exercises")
                        .select(
                            "exercises.courseId",
                            database.raw(
                                "COUNT(exercises.id) as totalExercises"
                            )
                        )
                        .groupBy("exercises.courseId")
                        .then(rows => {
                            //totalExercisesPerCourse = rows;
                            mergedResult["totalExercisesPerCourse"] = rows;
                            return Promise.resolve(mergedResult);
                        })
                        .then(mergedResult => {
                            database("exercises")
                                .select(
                                    database.raw(
                                        "COUNT(exercises.id) as totalExercisesCompleted"
                                    ),
                                    "exercises.courseId"
                                )
                                .where(
                                    "exercises.id",
                                    "in",
                                    database("submissions")
                                        .select("submissions.exerciseId")
                                        .where({ "submissions.completed": 1 }) // ****change this with the enum value*****//
                                        .andWhere(
                                            "submissions.userId",
                                            "=",
                                            userId
                                        ) //******replace 9 with request.userId*****//
                                )
                                .groupBy("exercises.courseId")
                                .then(rows => {
                                    mergedResult[
                                        "exerciseCompeletedPerCourse"
                                    ] = rows;
                                    //exerciseCompeletedPerCourse = rows;
                                    return Promise.resolve(mergedResult);
                                })
                                .then(mergedResult => {
                                    database("course_relation")
                                        .select(
                                            "course_relation.courseId",
                                            "course_relation.reliesOn"
                                        )
                                        .then(rows => {
                                            //courseReliesOn = rows;
                                            mergedResult[
                                                "courseReliesOn"
                                            ] = rows;
                                            return Promise.resolve(
                                                mergedResult
                                            );
                                        })
                                        .then(mergedResult => {
                                            //
                                            //
                                            //
                                            allAvailableCourses =
                                                mergedResult[
                                                "allAvailableCourses"
                                                ];
                                            exerciseCompeletedPerCourse =
                                                mergedResult[
                                                "exerciseCompeletedPerCourse"
                                                ];
                                            totalExercisesPerCourse =
                                                mergedResult[
                                                "totalExercisesPerCourse"
                                                ];
                                            courseReliesOn =
                                                mergedResult["courseReliesOn"];
                                            //
                                            //
                                            //
                                            availableCourses = manipulateResultSet(
                                                totalExercisesPerCourse,
                                                exerciseCompeletedPerCourse,
                                                courseReliesOn,
                                                allAvailableCourses,
                                                courseConfig.courseCompleteionCriteria
                                            );
                                              
                                            resolve(availableCourses);
                                            //
                                            //
                                            //
                                            //return Promise.resolve('abc');
                                        });
                                });
                        });
                });
        });
    }

    public checkIfDependencyCourseUnlocked(
        initialAvailableCourses,
        availableCoursesPostAssigmentApproval,
        userId,
        courseId
    ) {
        let initialAvaiblecourseIDs = _.pluck(initialAvailableCourses, "id");
        // 
        // 
        // 
        let availableCoursesPostAssigmentApprovalIDs = _.pluck(
            availableCoursesPostAssigmentApproval,
            "id"
        );
        // 
        // 
        // 
        let unlockedCourses = _.difference(
            availableCoursesPostAssigmentApprovalIDs,
            initialAvaiblecourseIDs
        );
        unlockedCourses.length > 0
            ? this.ProcessEmailNotification(unlockedCourses, userId,courseId)
            : null;
        //
        //
        //
    }

    public ProcessEmailNotification(unlockedCourses, userId,parentCourseId) {
        let student, courses;
        let cousresQ = database("courses")
            .select("name", "id")
            .whereIn("id", unlockedCourses)
            .then(rows => {
                courses = rows;
                return Promise.resolve(courses);
            });

        let studentQ = database("users")
            .select("*")
            .where({
                "users.id": userId
            })
            .then(rows => {
                student = rows[0];
                return Promise.resolve();
            });
            
            let percentage
            let callbackReturn =  calculatePercentageOfaCourse(userId,parentCourseId);
            callbackReturn.then(e=>{
                percentage=e
                  console.log("What i am getting back ", e)
              })
            

        Promise.all([cousresQ, studentQ]).then(() => {
            let coursesName = _.pluck(courses, "name").toString();
         

            let courseObject = {
                "receiverEmail": student.email,
                "messageArgs": {
                    "percent": percentage,
                    "courseDetails": courses
                }
            }

            sendCliqIntimationMessagetest('courseDependencyUnlocked', courseObject).then(result => {

            })
            // sendCoursesUnlockedForUserEmail(student, coursesName);
        });
    }


    public markCourseCompleted(studentId, courseId) {
    // public markCourseCompleted(request, h) {



        return new Promise((resolve, reject) => {
            // let courseId = 18;
            // let studentId = 83;

            let student, courses;
            let cousresQ = database("courses")
                .count("exercises.courseId as courseCount")
                .select("courses.name")
                .innerJoin("exercises",
                    "courses.id",
                    "exercises.courseId")
                .where("courses.id", courseId)
                .then(rows => {


                    courses = rows[0];

                    return Promise.resolve(courses);
                });

            let studentQ = database("courses")
                .count("submissions.id as submissionCount")
                .select("users.email")
                .innerJoin("exercises",
                    "courses.id",
                    "exercises.courseId")
                .leftJoin("submissions",
                    "submissions.exerciseId",
                    "exercises.id")
                .innerJoin("users",
                    "users.id",
                    "submissions.userId")

                .where({
                    "submissions.userId": studentId
                })
                .andWhere({
                    "courses.id": courseId
                })
                .then(rows => {

                    student = rows[0];

                    return Promise.resolve(student);
                });


            Promise.all([cousresQ, studentQ]).then(() => {



                // console.log(courses.courseCount, student.submissionCount);



                if (courses.courseCount == student.submissionCount) {
                    let submissionInsertQuery = database("course_enrolments")
                        .update({
                            'courseStatus': 'completed',
                            'completedAt': new Date()
                        })
                        .where({
                            studentId: studentId,
                            courseId: courseId
                        }).then(row => {
                            return Promise.resolve();
                        });


                    let mentorObject = {
                        "receiverEmail": student.email,
                        "messageArgs": {

                        }
                    }


                    sendCliqIntimationMessagetest('courseMarkedCompletedAutomatic', mentorObject).then(result => {

                    })

                    // let studentObject = {
                    //     "receiverId": student.email,
                    //     "message": `Hi ${student.name}, Apka yeh ${coursesName} unlockced hogya ha.`
                    // }


                    // sendCliqIntimation(studentObject).then(result => {

                    // })
                    //sendCoursesUnlockedForUserEmail(student, coursesName);
                }
            });
        });
    }
}
