import * as Hapi from 'hapi';
import * as Boom from "boom";
// import * as GoogleCloudStorage from "@google-cloud/storage";

import database from "../../";
import {IServerConfigurations} from "../../configurations/index";

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

// #TODO: Add support for tracking assignmnt completion time.

export default class AssignmentController {

    private configs: IServerConfigurations;
    private database: any;

    constructor(configs: IServerConfigurations, database: any) {
        this.database = database;
        this.configs = configs;
    }

    public postExerciseSubmission(request, h) {
        return new Promise((resolve, reject) => {

            database('course_enrolments').select('*')
                .where({
                    'studentId': request.userId,
                    'courseId': request.params.courseId
                })
                .then((rows) => {
                    if (rows.length > 0) {
                        return Promise.resolve({canSubmit: true});
                    } else {
                        reject(Boom.expectationFailed("User can't submit an assignment unless enrolled in course"));
                        return Promise.resolve({canSubmit: false});
                    }
                })
                .then((response) => {
                    if (response.canSubmit === true) {
                        let count;
                        database('exercises').select().where('id', request.params.exerciseId)
                            .then((rows) => {
                                if (rows.length < 1) {
                                    reject(Boom.notFound('The exercise with the given ID is not found.'));
                                    return Promise.reject("Rejected");
                                }
                                else {
                                    return Promise.resolve(rows[0]);
                                }
                            })
                            .then((exercise) => {
                                return database('submissions').count('id as count').where({
                                    'submissions.userId': request.userId,
                                    'exerciseId': request.params.exerciseId,
                                    // 'completed': 1
                                }).then((rows) => {
                                    count = rows[0].count;
                                    return Promise.resolve(exercise);
                                });
                            })
                            .then((exercise) => {
                                let facilitatorIdQuery;
                                if (exercise.reviewType === 'manual') {
                                      return Promise.resolve({
                                        exerciseId: request.params.exerciseId,
                                        userId: request.userId,
                                        completed: 1,
                                        state: 'completed',
                                        completedAt: new Date()
                                    });
                                }

                                else if (exercise.reviewType === 'automatic') {
                                    return Promise.resolve({
                                        exerciseId: request.params.exerciseId,
                                        userId: request.userId,
                                        submitterNotes: request.payload.notes,
                                        // files: JSON.stringify(request.payload.files),
                                        state: 'completed',
                                        completed: 1,
                                        completedAt: new Date()
                                    });

                                }

                                else if (exercise.reviewType === 'peer' || exercise.reviewType === 'facilitator') {

                                    let reviewerIdQuery, facilitatorIdQuery;
                                    // TODO: FIND FACILIATOR FROM THE COURSES TABLE
                                    // TODO: ASK USERNAME OF FACILITAOR OPTIONALLY IN INFO.MD

                                    // facilitatorIdQuery = database('batches').select('batches.facilitatorId as reviewerID')
                                    //     .innerJoin('course_enrolments', 'batches.id', 'course_enrolments.batchId')
                                    //     .where({'course_enrolments.studentId': request.userId});

                                    facilitatorIdQuery = database('courses')
                                        .select('courses.facilitator as reviewerID')
                                        .where({'courses.id':request.params.courseId});

                                    if (exercise.reviewType === 'peer') {
                                        reviewerIdQuery = database('submissions').select('submissions.userId as reviewerID')
                                            .innerJoin('course_enrolments', 'submissions.userId', 'course_enrolments.studentId')
                                            // .innerJoin('batches', 'batches.courseId', 'course_enrolments.batchId')
                                            .where({
                                                'submissions.completed': 1,
                                                'submissions.exerciseId': request.params.exerciseId,
                                                'course_enrolments.courseId': request.params.courseId
                                            }).orderByRaw('RAND()').limit(1);

                                    } else {
                                        reviewerIdQuery = facilitatorIdQuery;
                                    }

                                    return reviewerIdQuery.then((rows) => {
                                              let reviewerId;
                                              if (rows.length < 1 && exercise.reviewType === 'peer') {
                                                  return facilitatorIdQuery.then((rows) => {
                                                      reviewerId = rows[0].reviewerID;
                                                      return Promise.resolve({reviewerId: reviewerId});
                                                  });
                                              } else {
                                                  let reviewerId = rows[0].reviewerID;
                                                  return Promise.resolve({reviewerId: reviewerId});
                                              }
                                        })
                                          .then((response) => {
                                                return Promise.resolve({
                                                  exerciseId: request.params.exerciseId,
                                                  userId: request.userId,
                                                  submitterNotes: request.payload.notes,
                                                  // files: JSON.stringify(request.payload.files),
                                                  state: 'pending',
                                                  completed: 0,
                                                  peerReviewerId: response.reviewerId,
                                              });
                                        });
                                }


                            })
                            .then((queryData)=>{
                                // checks if we need to update existing submission of student
                                // or create a new submission
                                let submissionInsertQuery;
                                if (count >= 1){
                                    submissionInsertQuery = database('submissions')
                                            .select(`submissions.id`)
                                            .where({
                                                'submissions.userId': request.userId,
                                                'exerciseId': request.params.exerciseId,
                                            })
                                            .update(queryData)
                                            .then((row) => {
                                                return Promise.resolve();
                                            });
                                } else{
                                    submissionInsertQuery = database('submissions')
                                          .insert(queryData)
                                          .then((rows) => {
                                              return Promise.resolve();
                                          });
                                }

                                submissionInsertQuery.then(() => {
                                    return database('submissions')
                                        .select(
                                            // Submissions table fields
                                            'submissions.state', 'submissions.completed')
                                        .where(
                                            {
                                              'submissions.userId': request.userId,
                                              'exerciseId': request.params.exerciseId
                                            }
                                        );
                                })
                                .then((rows) => {
                                    resolve(rows[0]);
                                });
                        });
                    }
                });
        });
    }

    public uploadExerciseAssignment(request: Hapi.request, reply: Hapi.IReply) {
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
        //         console.log(err);
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

            let submissionQuery =
                database('submissions')
                    .select(
                        // Submissions table fields
                        'submissions.id', 'submissions.exerciseId', 'submissions.submittedAt', 'submissions.submitterNotes',
                        'submissions.files', 'submissions.notesReviewer', 'submissions.state', 'submissions.completed',
                        'submissions.completedAt',
                        // Reviewer details
                        'reviewUsers.name as reviwerName', 'reviewUsers.id as reviwerId',
                        'reviewUsers.profilePicture as reviewerProfilePicture',
                        'reviewUsers.facilitator as isReviewerFacilitator',
                        // Submitter Details
                        'users.name as submitterName', 'users.id as submitterId', 'users.profilePicture as submitterProfilePicture',
                        'users.facilitator as isSubmitterFacilitator'
                    )
                    .leftJoin(database.raw('users reviewUsers'), 'submissions.peerReviewerId', 'reviewUsers.id')
                    .leftJoin('users', 'submissions.userId', 'users.id');

            let whereClause = {
                'submissions.exerciseId': request.params.exerciseId
            };
            if (request.query.submissionUsers === 'current') {
                whereClause['submissions.userId'] = request.userId;
            }
            if (request.query.submissionState !== 'all') {
                whereClause['submissions.state'] = request.query.submissionState;
            }

            submissionQuery.where(whereClause)
                .then((rows) => {
                    let submissions = [];
                    for (let i = 0; i < rows.length; i++) {
                        let submission = rows[i];
                        if (submission.files !== null) {
                            submission.files = JSON.parse(submission.files);
                        }
                        submissions.push(submission);
                    }
                    resolve({"data": submissions});
                });
        });

    }

    public getExerciseSubmissionById(request, h) {
        return new Promise((resolve, reject) => {
            database('submissions')
                .select('submissions.id', 'submissions.exerciseId', 'submissions.userId', 'submissions.submittedAt',
                    'submissions.submitterNotes', 'submissions.files', 'submissions.notesReviewer', 'submissions.state',
                    'submissions.completed', 'submissions.completedAt', 'submissions.submittedAt', 'users.name as reviwerName',
                    'users.id as reviwerId', 'users.profilePicture as reviewerProfilePicture', 'users.facilitator as isReviewerFacilitator')
                .leftJoin('users', 'submissions.peerReviewerId', 'users.id')
                .where({'submissions.id': request.params.submissionId})
                .then((rows) => {
                    let submission = rows[0];
                    if (submission.files !== null) {
                        submission.files = JSON.parse(submission.files);
                    }
                    resolve(submission);
                });
        });

    }

    public getPeerReviewRequests(request: Hapi.Request, reply: Hapi.IReply) {
        return new Promise((resolve, reject) => {
            // Hackish Solution to show all the review to the Developer.
            let developerEmails = [
                'amar17@navgurukul.org',
                'diwakar17@navgurukul.org',
                // 'lalita17@navgurukul.org',
                // 'kanika17@navgurukul.org',
                // 'rani17@navgurukul.org',
                // 'khusboo17@navgurukul.org',
            ];

            database('users')
                .select('users.email')
                .where({'users.id': request.userId})
                .then((rows)=> {
                    if(developerEmails.indexOf(rows[0].email) > -1){
                        // Show all the Peer Review to the user when the User is Developer.
                        return Promise.resolve({
                        whereClause:{}
                        });
                    }
                    // if not a developer show him the assignmnt assign to him for
                    // reviewing
                    return Promise.resolve({
                        whereClause:{
                        'submissions.peerReviewerId': request.userId
                        }
                    });
                })
                // Hackish solution till here.
                .then((response) => {
                    database('submissions')
                    .select(
                        // Submissions table
                        'submissions.id', 'submissions.exerciseId', 'submissions.submittedAt', 'submissions.submitterNotes',
                        'submissions.files', 'submissions.files', 'submissions.notesReviewer', 'submissions.state', 'submissions.completed',
                        'submissions.completedAt', 'submissions.submittedAt', 'submissions.submittedAt',
                        // Exercises Table
                        'exercises.id as exerciseId', 'exercises.parentExerciseId as parentExerciseId', 'exercises.courseId',
                        'exercises.name as exerciseName', 'exercises.slug as exerciseSlug', 'exercises.sequenceNum as exerciseSequenceNum',
                        'exercises.reviewType', 'exercises.content as exerciseContent',
                        // Users table
                        'users.id as submitterId', 'users.name as submitterName', 'users.profilePicture as submitterProfilePicture',
                        'users.facilitator as isSubmitterFacilitator'
                    )
                    .innerJoin('exercises', 'submissions.exerciseId', 'exercises.id')
                    .innerJoin('users', 'submissions.userId', 'users.id')
                    .where(response.whereClause)
                    .orderBy('submittedAt', 'desc')
                    .then((rows) => {
                        let submissions = [];
                        for (let i = 0; i < rows.length; i++) {
                            let submission = rows[i];
                            if (submission.files !== null) {
                            submission.files = JSON.parse(submission.files);
                            }
                            submissions.push(submission);
                        }
                        resolve({"data": submissions});
                    });
                });
        });

    }

    public editPeerReviewRequest(request, h) {
        return new Promise((resolve, reject) => {
            database('submissions')
                .select('*')
                .where({'id': request.params.submissionId})
                .then((rows) => {
                    if (rows.length < 1) {
                        reject(Boom.notFound("A submission with the given ID does not exist."));
                        return Promise.reject("Rejected");
                    }
                    let submission = rows[0];
                    if (submission.state !== 'pending') {
                        reject(Boom.expectationFailed("The given submission has already been reviewed."));
                        return Promise.reject("Rejected");
                    }
                    return Promise.resolve(submission);
                })
                .then((submission) => {
                    let updateFields = {
                        notesReviewer: request.payload.notes
                    };
                    if (request.payload.approved) {
                        updateFields['completed'] = 1;
                        updateFields['state'] = 'completed';
                        updateFields['completedAt'] = new Date();
                    } else {
                        updateFields['completed'] = 0;
                        updateFields['state'] = 'rejected';
                        updateFields['completedAt'] = new Date();
                    }
                    return Promise.resolve(updateFields);
                })
                .then((updateFields) => {
                    database('submissions')
                        .update(updateFields)
                        .where({id: request.params.submissionId})
                        .then(() => {
                            resolve({'success': true});
                        });
                });
            });
    }
}
