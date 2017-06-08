import * as Hapi from "hapi";
import * as Boom from "boom";
import * as Jwt from "jsonwebtoken";
import * as GoogleAuth from "google-auth-library";
import * as GoogleCloudStorage from "@google-cloud/storage";

import database from "../";
import { IServerConfigurations } from "../configurations";

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
    private user: any ;

    constructor(configs: IServerConfigurations, database: any) {
        this.database = database;
        this.configs = configs;
    }

    public postExerciseSubmission(request: Hapi.Request, reply: Hapi.IReply) {
        
        database('exercises').select().where('id', request.params.exerciseId)
        .then( (rows) => {
            if (rows.length < 1) {
                reply(Boom.notFound('The exercise with the given ID is not found.'));
                return Promise.reject("Rejected");
            }
            else {
                return Promise.resolve(rows[0]);
            }
        })
        .then( (exercise) => {
            return database('submissions').count('id as count').where({
                'submissions.userId': request.userId,
                'exerciseId': request.params.exerciseId,
                'completed': 1
            }).then( (rows) => {
                let count = rows[0].count
                if ((count) > 0) {
                    reply(Boom.conflict("An approved submission for the given exercise ID by the user already exists."));
                    return Promise.reject("Rejected");
                }
                return Promise.resolve(exercise);
            })
        })
        .then( (exercise) => {
            let submissionInsertQuery;

            if (exercise.reviewType === 'manual') {
                submissionInsertQuery = database('submissions').insert({
                    exerciseId: request.params.exerciseId,
                    userId: request.userId,
                    completed: 1,
                    state: 'completed',
                    completedAt: new Date()
                })
            } 
            
            else if (exercise.reviewType == 'automatic') {
                submissionInsertQuery = database('submissions').insert({
                    exerciseId: request.params.exerciseId,
                    userId: request.userId,
                    submitterNotes: request.payload.notes,
                    files: JSON.stringify(request.payload.files),
                    state: 'approved',
                    completed: 1
                })
            } 
            
            else if (exercise.reviewType == 'peer' || exercise.reviewType == 'facilitator') {
                
                let reviewerIdQuery, facilitatorIdQuery;
                facilitatorIdQuery = database('batches').select('batches.facilitatorId as reviewerID')
                    .innerJoin('course_enrolments', 'batches.id', 'course_enrolments.batchId')
                    .where({ 'course_enrolments.studentId': request.userId });
                if (exercise.reviewType == 'peer') {
                    reviewerIdQuery = database('submissions').select('submissions.userId as reviewerID')
                    .innerJoin('course_enrolments', 'submissions.userId', 'course_enrolments.studentId')
                    .innerJoin('batches', 'batches.courseId', 'course_enrolments.batchId')
                    .where({
                        'submissions.completed': 1,
                        'submissions.exerciseId': request.params.exerciseId,
                        'course_enrolments.courseId': request.params.courseId
                    }).orderByRaw('RAND()').limit(1);
                } else  {
                    reviewerIdQuery = facilitatorIdQuery;
                    
                }

                submissionInsertQuery = reviewerIdQuery.then( (rows) => {
                    let reviewerId;
                    if (rows.length < 1 && exercise.reviewType === 'peer') {
                        return facilitatorIdQuery.then( (rows) => {
                            reviewerId = rows[0].reviewerID;
                            return Promise.resolve({ reviewerId: reviewerId });
                        });
                    } else {
                        let reviewerId = rows[0].reviewerID;
                        return Promise.resolve({ reviewerId: reviewerId });
                    }
                })
                .then( (response) => {
                    return database('submissions').insert({
                        exerciseId: request.params.exerciseId,
                        userId: request.userId,
                        submitterNotes: request.payload.notes,
                        files: JSON.stringify(request.payload.files),
                        state: 'pending',
                        completed: 0,
                        peerReviewerId: response.reviewerId,
                    });
                })
            }

            submissionInsertQuery.then( (rows) =>{
                return reply({ 'success': true });
            });

        })
    }

    public uploadExerciseAssignment(request: Hapi.request, reply: Hapi.IReply) {

            let gcs = GoogleCloudStorage({
                projectId: this.configs.googleCloud.projectId,
                keyFilename: __dirname + '/../' + this.configs.googleCloud.keyFilename
            });

            let bucket = gcs.bucket(this.configs.googleCloud.assignmentsBucket);

            var fileData = request.payload.file;
            if (fileData) {
                let dir = request.userId + '/' + request.params.courseId + '/' + request.params.exerciseId;
                let name = generateUID() + '.' + fileData.hapi.filename;
                let filePath = dir + '/' + name;
                let file = bucket.file(filePath);

                let stream = file.createWriteStream({
                    metadata: {
                        contentType: fileData.hapi.headers['content-type']
                    }
                });

                stream.on('error', (err) => {
                    console.log(err);
                    return reply(Boom.badImplementation("There was some problem uploading the file. Please try again."));
                });
                stream.on('finish', () => {
                    return reply({
                        "success": true,
                        "filePath": "https://storage.googleapis.com/" + this.configs.googleCloud.assignmentsBucket + '/' + filePath;
                    });
                });

                stream.end(fileData._data);
            }
    }

    public getExerciseSubmissions(request: Hapi.Request, reply: Hapi.IReply) {

        let submissionQuery = 
            database('submissions')
            .select(
                    // Submissions table fields
                    'submissions.id', 'submissions.exerciseId', 'submissions.submittedAt', 'submissions.submitterNotes', 
                    'submissions.files', 'submissions.notesReviewer', 'submissions.state', 'submissions.completed', 'submissions.completedAt', 
                    // Reviewer details
                    'reviewUsers.name as reviwerName', 'reviewUsers.id as reviwerId', 'reviewUsers.profilePicture as reviewerProfilePicture',
                    'reviewUsers.facilitator as isReviewerFacilitator',
                    // Submitter Details
                    'users.name as submitterName', 'users.id as submitterId', 'users.profilePicture as submitterProfilePicture',
                    'users.facilitator as isSubmitterFacilitator'
            )
            .leftJoin(database.raw('users reviewUsers'), 'submissions.peerReviewerId', 'reviewUsers.id')
            .leftJoin('users', 'submissions.userId', 'users.id')

        let whereClause = {
            'submissions.exerciseId': request.params.exerciseId
        }
        if (request.query.submissionUsers === 'current') {
            whereClause['submissions.userId'] = request.userId
        }
        if (request.query.submissionState !== 'all') {
            whereClause['submissions.state'] = request.query.submissionState
        }

        submissionQuery.where(whereClause)
        .then( (rows) => {
            let submissions = [];
            for (let i = 0; i < rows.length; i++){
                let submission = rows[i];
                console.log(submission.files);
                if (submission.files !== null) {
                    submission.files = JSON.parse(submission.files);
                }
                submissions.push(submission);
            }
            return reply({ "data": submissions });
        });            

    }

    public getExerciseSubmissionById(request: Hapi.Request, reply: Hapi.IReply) {

        database('submissions')
        .select('submissions.id', 'submissions.exerciseId', 'submissions.userId', 'submissions.submittedAt',
                'submissions.submitterNotes', 'submissions.files', 'submissions.notesReviewer', 'submissions.state',
                'submissions.completed', 'submissions.completedAt', 'submissions.submittedAt', 'users.name as reviwerName',
                'users.id as reviwerId', 'users.profilePicture as reviewerProfilePicture', 'users.facilitator as isReviewerFacilitator')
        .leftJoin('users', 'submissions.peerReviewerId', 'users.id')
        .where({ 'submissions.id':  request.params.submissionId })
        .then( (rows) => {
            let submission = rows[0];
            if (submission.files !== null){
                submission.files = JSON.parse(submission.files);
            }
            return reply(submission);
        });

    }

    public getPeerReviewRequests(request: Hapi.Request, reply: Hapi.IReply) {

        database('submissions')
        .select(
                // Submissions table
                'submissions.id', 'submissions.exerciseId', 'submissions.submittedAt', 'submissions.submitterNotes',
                'submissions.files', 'submissions.files', 'submissions.notesReviewer', 'submissions.state', 'submissions.completed',
                'submissions.completedAt', 'submissions.submittedAt', 'submissions.submittedAt',
                // Exercises Table
                'exercises.id as exerciseId', 'exercises.parentExerciseId as parentExerciseId', 'exercises.name',
                'exercises.name as exerciseName', 'exercises.slug as exerciseSlug', 'exercises.sequenceNum as exerciseSequenceNum',
                'exercises.reviewType', 'exercises.content as exerciseContent',
                // Users table
                'users.id as submitterId', 'users.name as submitterName', 'users.profilePicture as submitterProfilePicture',
                'users.facilitator as isSubmitterFacilitator'
        )
        .innerJoin('exercises', 'submissions.exerciseId', 'exercises.id')
        .innerJoin('users', 'submissions.userId', 'users.id')
        .where({ 'submissions.peerReviewerId': 28 })
        .orderBy('submittedAt', 'desc')
        .then( (rows) => {
            let submissions = [];
            for (let i = 0; i < rows.length; i++){
                let submission = rows[i];
                console.log(submission.files);
                if (submission.files !== null) {
                    submission.files = JSON.parse(submission.files);
                }
                submissions.push(submission);
            }
            return reply({ "data": submissions });
        })

    }

    public editPeerReviewRequest(request: Hapi.Request, reply: Hapi.IReply) {

        database('submissions')
        .select('*')
        .where({ 'id': request.params.submissionId })
        .then( (rows) => {
            if (rows.length < 1){
                reply(Boom.notFound("A submission with the given ID does not exist."));
                return Promise.reject("Rejected");
            }
            let submission = rows[0];
            if (submission.state !== 'pending') {
                reply(Boom.expectationFailed("The given submission has already been reviewed."));
                return Promise.reject("Rejected");
            }
            return Promise.resolve(submission);
        })
        .then( (submission) => {
            let updateFields = {
                notesReviewer: request.params.notes
            };
            if (request.params.approved) {
                updateFields['completed'] = 1;
                updateFields['state'] = 'approved';
                updateFields['completedAt'] = new Date();
            } else {
                updateFields['completed'] = 0;
                updateFields['state'] = 'rejected';
                updateFields['completedAt'] = new Date();
            }
            return database('submissions')
                   .update(updateFields)
                   .where({ id: request.params.submissionId })
        })
        .then( (response) => {
            return {'success': true}
        });

    }

}

