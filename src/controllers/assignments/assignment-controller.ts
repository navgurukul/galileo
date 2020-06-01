import * as Hapi from "hapi";
import * as Boom from "boom";
import {
    manipulateResultSet,
    isStudentEligibleToEnroll
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
    sendCliqIntimation
} from "../../cliq";

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
            database("course_enrolments")
                .select("*")
                .where({
                    student_id: request.user_id,
                    course_id: request.params.courseId
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
                        /** Validate the exercise_id does the exercise exist or not not */
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
                                        "submissions.user_id": request.user_id,
                                        exercise_id: request.params.exerciseId
                                    })
                                    .then(rows => {
                                        count = rows[0].count;
                                        return Promise.resolve(exercise);
                                    });
                            })
                            .then(exercise => {
                                // let facilitatorIdQuery;

                                /** Not in work */
                                if (exercise.review_type === "manual") {
                                    return Promise.resolve({
                                        exercise_id: request.params.exerciseId,
                                        user_id: request.user_id,
                                        completed: 1,
                                        state: "completed",
                                        completed_at: new Date()
                                    });
                                } else if (
                                    exercise.review_type === "automatic"
                                ) {
                                    /** Not in work */
                                    return Promise.resolve({
                                        exercise_id: request.params.exerciseId,
                                        user_id: request.user_id,
                                        submitter_notes: request.payload.notes,
                                        // files: JSON.stringify(request.payload.files),
                                        state: "completed",
                                        completed: 1,
                                        completed_at: new Date()
                                    });
                                } else if (
                                    exercise.review_type === "peer" ||
                                    exercise.review_type === "facilitator"
                                ) {
                                    let reviewerIdQuery, facilitatorIdQuery;

                                    /** Finding the facilitator of the student center */
                                    facilitatorIdQuery = database("users")
                                        .select("users.center as studentCenter")
                                        .where({
                                            "users.id": request.user_id
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
                                                .select("user_id as reviewerID")
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
                                    if (exercise.review_type === "peer") {
                                        reviewerIdQuery = database(
                                            "submissions"
                                        )
                                            .select(
                                                "submissions.user_id as reviewerID"
                                            )
                                            .innerJoin(
                                                "course_enrolments",
                                                "submissions.user_id",
                                                "course_enrolments.student_id"
                                            )
                                            .where({
                                                "submissions.completed": 1,
                                                "submissions.exercise_id":
                                                    request.params.exerciseId,
                                                "course_enrolments.course_id":
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
                                                exercise.review_type === "peer"
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
                                                exercise_id:
                                                    request.params.exerciseId,
                                                user_id: request.user_id,
                                                submitter_notes:
                                                    request.payload.notes,
                                                // files: JSON.stringify(request.payload.files),
                                                state: "pending",
                                                completed: 0,
                                                peer_reviewer_id:
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
                                            "submissions.user_id":
                                                request.user_id,
                                            exercise_id:
                                                request.params.exerciseId
                                        })
                                        .update(queryData)
                                        .then(row => {
                                            return Promise.resolve({
                                                reviewerId:
                                                    queryData.peer_reviewer_id,
                                                student_id: queryData.user_id
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
                                                    queryData.peer_reviewer_id,
                                                student_id: queryData.user_id
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
                                                "users.id": response.student_id
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
                                                    "submissions.exercise_id"
                                                )
                                                .where({
                                                    "submissions.user_id":
                                                        request.user_id,
                                                    exercise_id:
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

                                        let reviewerObject = {
                                            "receiverId": reviewer.email,
                                            "message": `${student.name} as submitted his assignment. Please review it http://saral.navgurukul.org/assignment-review?submissionId=${rows[0].submissionId}`
                                        }
                                        let studentObject = {
                                            "receiverId": student.email,
                                            "message": `${reviewer.name} has been intimated for your assignment review`
                                        }


                                        sendCliqIntimation(reviewerObject).then(result => {
                                            
                                        })
                                        sendCliqIntimation(studentObject).then(result => {
                                            
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
        //     let dir = request.user_id + '/' + request.params.courseId + '/' + request.params.exerciseId;
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
            // query to find all the submission of particular exercise_id
            let submissionQuery = database("submissions")
                .select(
                    // Submissions table fields
                    "submissions.id",
                    "submissions.exercise_id",
                    "submissions.submitted_at",
                    "submissions.submitter_notes",
                    "submissions.files",
                    "submissions.notes_reviewer",
                    "submissions.state",
                    "submissions.completed",
                    "submissions.completed_at",
                    // Reviewer details
                    // "reviewUsers.name as reviewerName",
                    // "reviewUsers.id as reviewerId",
                    // "reviewUsers.profile_picture as reviewerProfilePicture",
                    // 'reviewUsers.facilitator as isReviewerFacilitator',
                    // Submitter Details
                    "users.name as submitterName",
                    "users.id as submitterId",
                    "users.profile_picture as submitterProfilePicture"
                    // 'users.facilitator as isSubmitterFacilitator'
                )
                // .leftJoin(
                //     database.raw("users reviewUsers"),
                //     "submissions.peer_reviewer_id",
                //     "reviewUsers.id"
                // )
                .leftJoin("users", "submissions.user_id", "users.id");

            // Clauses to search the exercisesId
            let whereClause = {
                "submissions.exercise_id": request.params.exerciseId
            };

            // Wether to search submissions of the current user or not.
            if (request.query.submissionUsers === "current") {
                whereClause["submissions.user_id"] = request.user_id;
            }

            // the state of the submissions of the student.
            if (request.query.submissionState !== "all") {
                whereClause["submissions.state"] =
                    request.query.submissionState;
            }

            submissionQuery.where(whereClause).then(rows => {
                console.log(rows, "Pral")
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
                    "submissions.exercise_id",
                    "submissions.user_id",
                    "submissions.submitted_at",
                    "submissions.submitter_notes",
                    "submissions.files",
                    "submissions.notes_reviewer",
                    "submissions.state",
                    "submissions.completed",
                    "submissions.completed_at",
                    "submissions.submitted_at",
                    "users.name as reviewerName",
                    "users.id as reviewerId",
                    "users.profile_picture as reviewerProfilePicture"
                )
                .leftJoin("users", "submissions.peer_reviewer_id", "users.id")
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
            //request.user_id = 29;
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
                .where({ "users.id": request.user_id })
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
                            "submissions.peer_reviewer_id": request.user_id
                        }
                    });
                })
                // *************** Hackish solution till here ********************.

                .then(response => {
                    database("submissions")
                        .select(
                            // Submissions table
                            "submissions.id",
                            "submissions.exercise_id",
                            "submissions.submitted_at",
                            "submissions.submitter_notes",
                            "submissions.files",
                            "submissions.notes_reviewer",
                            "submissions.state",
                            "submissions.completed",
                            "submissions.completed_at",
                            "submissions.submitted_at",
                            // Exercises Table
                            "exercises.id as exercise_id",
                            "exercises.parent_exercise_id as parent_exercise_id",
                            "exercises.course_id",
                            "exercises.name as exerciseName",
                            "exercises.slug as exerciseSlug",
                            "exercises.sequence_num as exerciseSequenceNum",
                            "exercises.review_type",
                            "exercises.content as exerciseContent",
                            // Users table
                            "users.id as submitterId",
                            "users.name as submitterName",
                            "users.profile_picture as submitterProfilePicture"
                            // 'users.facilitator as isSubmitterFacilitator'
                        )
                        .innerJoin(
                            "exercises",
                            "submissions.exercise_id",
                            "exercises.id"
                        )
                        .innerJoin("users", "submissions.user_id", "users.id")
                        .where(response.whereClause)
                        .orderBy("submitted_at", "desc")
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
        //request.user_id = 29;
        let isAssigmentApproved = false;
        let initialAvailableCourses;
        let availableCoursesPostAssigmentApproval;
        let course_id;
        return new Promise((resolve, reject) => {
            // submitting the review of the submitted assignment

            database("submissions")
                .select(
                    "submissions.id",
                    "submissions.user_id",
                    "submissions.state",
                    "submissions.peer_reviewer_id",
                    "submissions.exercise_id",
                    "submissions.Id",
                    "mentors.mentor",
                    "users.center"
                )
                .leftJoin("mentors", "user_id", "mentee")
                .innerJoin("users", "submissions.user_id", "users.id")
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
                    database('exercises').select('course_id').where({ 'exercises.id': submission.exercise_id }).then((rows) => {

                        course_id = rows[0].course_id;
                        //
                        return Promise.resolve(course_id);
                    }).then(course_id => {
                        
                        //
                        database("course_enrolments")
                            .select("*")
                            .where({
                                student_id: request.user_id,
                                course_id: course_id
                            })
                            .then(rows => {
                                if (rows.length > 0) {
                                    return Promise.resolve({
                                        isAlreadyEnrolled: true,
                                        course_id: course_id
                                    });
                                } else {
                                    reject(
                                        Boom.expectationFailed(
                                            "the user is not enrolled in this course"
                                        )
                                    );
                                    return Promise.resolve({
                                        isAlreadyEnrolled: false,
                                        course_id: course_id
                                    });
                                }
                            })
                            .then(response => {
                                if (response.isAlreadyEnrolled) {
                                    database("submissions")
                                        .select("submissions.id",
                                            "submissions.user_id",
                                            "submissions.state",
                                            "submissions.peer_reviewer_id",
                                            "submissions.Id",
                                            "mentors.mentor",
                                            "users.center")
                                        .leftJoin("mentors", "user_id", "mentee")
                                        .innerJoin(
                                            "users",
                                            "submissions.user_id",
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
                                                notes_reviewer: request.payload.notes
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
                                                    let usersId = request.user_id;

                                                    let usersFacilatorId = rows[0]
                                                        ? rows[0].user_id
                                                        : null;
                                                    //

                                                    if (
                                                        usersId ===
                                                        submission.peer_reviewer_id ||
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
                                                                "completed_at"
                                                            ] = new Date();
                                                            updateFields[
                                                                "mark_completed_by"
                                                            ] = usersId;
                                                        } else {
                                                            updateFields[
                                                                "completed"
                                                            ] = 0;
                                                            updateFields["state"] =
                                                                "rejected";
                                                            updateFields[
                                                                "mark_completed_by"
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
                                                    request.user_id
                                                ).then(courses => {
                                                    initialAvailableCourses = courses;
                                                    database("submissions")
                                                        .update(updateFields)
                                                        .where({
                                                            id:
                                                                request.params
                                                                    .submissionId
                                                        })
                                                        .then(rows => {
                                                            this.checkDependencyCourses(
                                                                request.user_id
                                                            ).then(courses => {
                                                                availableCoursesPostAssigmentApproval = courses;
                                                                this.checkIfDependencyCourseUnlocked(
                                                                    initialAvailableCourses,
                                                                    availableCoursesPostAssigmentApproval,
                                                                    request.user_id
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
                                                                            submission.user_id
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
                                                                            submission.user_id
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
                                                                            "exercises.course_id",
                                                                            "exercises.slug",
                                                                            "exercises.name"
                                                                        )
                                                                        .innerJoin(
                                                                            "exercises",
                                                                            "exercises.id",
                                                                            "submissions.exercise_id"
                                                                        )
                                                                        .where({
                                                                            "submissions.id":
                                                                                submission.id
                                                                        })
                                                                        .then(
                                                                            rows => {
                                                                                let studentObject = {
                                                                                    "receiverId": student.name,
                                                                                    "message": `Hi ${student.name}, Apka assignment ${reviewer.name} ne check kardiya ha.` + 
                                                                                                `App ushe ish link par dekh sakte ho http://saral.navgurukul.org/course?id=${rows[0].course_id}&slug=${rows[0].slug}`
                                                                                }


                                                                                // sendAssignmentReviewCompleteEmail(
                                                                                //     student,
                                                                                //     reviewer,
                                                                                //     rows[0]
                                                                                // );
                                                                                return sendCliqIntimation(studentObject).then(result => {
                                                                                    
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
                                                                    submission.user_id
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
                                                                    submission.user_id
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
                                                                    "exercises.course_id",
                                                                    "exercises.slug",
                                                                    "exercises.name"
                                                                )
                                                                .innerJoin(
                                                                    "exercises",
                                                                    "exercises.id",
                                                                    "submissions.exercise_id"
                                                                )
                                                                .where({
                                                                    "submissions.id":
                                                                        submission.id
                                                                })
                                                                .then(rows => {
                                                                    let studentObject = {
                                                                        "receiverId": student.name,
                                                                        "message": `Hi ${student.name}, Apka assignment ${reviewer.name} ne check kardiya ha.` + 
                                                                                    `App ushe ish link par dekh sakte ho http://saral.navgurukul.org/course?id=${rows[0].course_id}&slug=${rows[0].slug}`
                                                                    }

                                                                    return sendCliqIntimation(studentObject).then(result => {
                                                                        
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

    public checkDependencyCourses(user_id) {
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
                    "courses.short_description",
                    "courses.sequence_num"
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
                                "course_enrolments.course_id"
                            ).andOn("course_enrolments.student_id", "=", user_id);
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
                            "exercises.course_id",
                            database.raw(
                                "COUNT(exercises.id) as totalExercises"
                            )
                        )
                        .groupBy("exercises.course_id")
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
                                    "exercises.course_id"
                                )
                                .where(
                                    "exercises.id",
                                    "in",
                                    database("submissions")
                                        .select("submissions.exercise_id")
                                        .where({ "submissions.completed": 1 }) // ****change this with the enum value*****//
                                        .andWhere(
                                            "submissions.user_id",
                                            "=",
                                            user_id
                                        ) //******replace 9 with request.user_id*****//
                                )
                                .groupBy("exercises.course_id")
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
                                            "course_relation.course_id",
                                            "course_relation.relies_on"
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
        user_id
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
            ? this.ProcessEmailNotification(unlockedCourses, user_id)
            : null;
        //
        //
        //
    }

    public ProcessEmailNotification(unlockedCourses, user_id) {
        let student, courses;
        let cousresQ = database("courses")
            .select("name")
            .whereIn("id", unlockedCourses)
            .then(rows => {
                courses = rows;
                return Promise.resolve();
            });

        let studentQ = database("users")
            .select("*")
            .where({
                "users.id": user_id
            })
            .then(rows => {
                student = rows[0];
                return Promise.resolve();
            });

        Promise.all([cousresQ, studentQ]).then(() => {
            let coursesName = _.pluck(courses, "name").toString();
            let studentObject = {
                "receiverId": student.email,
                "message": `Hi ${student.name}, Apka yeh ${coursesName} unlockced hogya ha.`
            }


            sendCliqIntimation(studentObject).then(result => {
                
            })
            // sendCoursesUnlockedForUserEmail(student, coursesName);
        });
    }
}
