import * as Hapi from "hapi";
import * as Boom from "boom";
import * as Jwt from "jsonwebtoken";
import * as GoogleAuth from "google-auth-library";

import database from "../";
import { IServerConfigurations } from "../configurations";


export default class ReportController {

    private configs: IServerConfigurations;
    private database: any;
    private user: any;

    constructor(configs: IServerConfigurations, database: any) {
        this.database = database;
        this.configs = configs;
    }

    public getBatchCourseReport(request: Hapi.Request, reply: Hapi.IReply) {

        /********************************************************
         * Note From Rishabh:
         * This code is uber fucked. I am too sleepy and just
         * putting up a working version out there. Will get to
         * refactoring it soon :)
        ********************************************************/

        let usersList;
        let exercisesList = {};

        let userQuery =
            database('course_enrolments')
                .select('users.name', 'users.id', 'users.profilePicture', 'users.facilitator')
                .innerJoin('users', 'course_enrolments.studentId', 'users.id')
                .where({
                    'course_enrolments.batchId': request.params.batchId,
                    'course_enrolments.courseId': request.params.courseId
                })
                .then((rows) => {
                    usersList = rows;
                });

        let exercisesQuery =
            database('exercises')
                .select('id', 'parentExerciseId', 'name', 'slug', 'sequenceNum', 'reviewType', 'content')
                .where({ 'courseId': request.params.courseId })
                .orderBy('sequenceNum', 'asc')
                .then((rows) => {
                    for (let i = 0; i < rows.length; i++) {
                        exercisesList[rows[i].id] = rows[i];
                        exercisesList[rows[i].id]['completionDetails'] = {};
                    }
                });

        Promise.all([userQuery, exercisesQuery]).then(() => {
            return database('submissions')
                .select('submissions.id', 'submissions.exerciseId', 'submissions.userId', 'submissions.submittedAt',
                'submissions.submitterNotes', 'submissions.files', 'submissions.state',
                'submissions.completed', 'submissions.completedAt')
                .innerJoin('exercises', 'submissions.exerciseId', 'exercises.id')
                .where({ 'exercises.courseId': request.params.courseId })
                .then((rows) => {
                    return Promise.resolve(rows);
                });
        })
            .then((rows) => {
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
                    let subStateOrder = ['rejected', 'pending', 'completed'];
                    let curSubState = subStateOrder.indexOf(submission.state);
                    let storedSubmission = exercisesList[submission.exerciseId]['completionDetails'][submission.userId] || {};

                    // No submission is stored in the object
                    if (Object.keys(storedSubmission).length === 0) {
                        exercisesList[submission.exerciseId]['completionDetails'][submission.userId] = submission;
                        exercisesList[submission.exerciseId]['completionDetails'][submission.userId]['attempts'] = 1;
                    }
                    // If the submission is stored
                    else {
                        let storedSubState = subStateOrder.indexOf(storedSubmission.state);
                        let attempts = exercisesList[submission.exerciseId]['completionDetails']
                        [submission.userId]['attempts'] + 1;
                        // Replace the stored submission with the current submission if
                        // the stored one is of a lesser level
                        if (storedSubState < curSubState) {
                            exercisesList[submission.exerciseId]['completionDetails'][submission.userId] = submission;
                        }
                        exercisesList[submission.exerciseId]['completionDetails'][submission.userId]['attempts'] = attempts;
                    }
                }

                //  Convert the dictionary of exercises into an array to return
                let _exercises = [];
                for (let i in exercisesList) {
                    _exercises.push(exercisesList[i]);
                }
                // Sort the exercises on basis of sequence numbers
                _exercises.sort((a, b) => {
                    if (a.sequenceNum < b.sequenceNum) {
                        return -1;
                    } else if (a.sequenceNum > b.sequenceNum) {
                        return 1;
                    } else {
                        return 0;
                    }
                });
                // Nest child exercises in parent exercises
                let exercises = [];
                for (let i = 0; i < _exercises.length; i++) {
                    let exercise = _exercises[i];
                    if (exercise.sequenceNum % 1 !== 0) {
                        let parentIndex = Number(String(exercise.sequenceNum).split('.')[0]) - 1;
                        exercises[parentIndex].childExercises.push(exercise);
                    } else {
                        exercise.childExercises = [];
                        exercises.push(exercise);
                    }
                }
                console.log(exercises[1].completionDetails[25]);
                return reply({
                    "exercises": exercises,
                    "users": usersList
                });
            });

    }

    public getStudentReport(request: Hapi.Request, reply: Hapi.IReply) {

        let submissionsObj = {};
        let submissionsList = [];
        database('submissions')
            .select('submissions.id', 'submissions.exerciseId', 'submissions.userId', 'submissions.submittedAt',
            'submissions.submitterNotes', 'submissions.files', 'submissions.state',
            'submissions.completed', 'submissions.completedAt', 'exercises.name')
            .innerJoin('exercises', 'submissions.exerciseId', 'exercises.id')
            .where({
                'exercises.courseId': request.params.courseId,
                'submissions.userId': request.params.userId
            })
            .then((rows) => {
                return Promise.resolve(rows);
            })
            .then((rows) => {
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
                    let subStateOrder = ['rejected', 'pending', 'completed'];
                    let curSubState = subStateOrder.indexOf(submission.state);
                    let storedSubmission = submissionsObj[submission.exerciseId] || {};

                    // No submission is stored in the object
                    if (Object.keys(storedSubmission).length === 0) {
                        submissionsObj[submission.exerciseId] = submission;
                        submissionsObj[submission.exerciseId]['attempts'] = 1;
                    }
                    // If the submission is stored
                    else {
                        let storedSubState = subStateOrder.indexOf(storedSubmission.state);
                        let attempts = submissionsObj[submission.exerciseId]['attempts'] + 1;
                        // Replace the stored submission with the current submission if
                        // the stored one is of a lesser level
                        if (storedSubState < curSubState) {
                            submissionsObj[submission.exerciseId] = submission;
                        }
                        submissionsObj[submission.exerciseId]['attempts'] = attempts;
                    }
                }
                for (let exerciseId in submissionsObj) {
                    if (submissionsObj.hasOwnProperty(exerciseId)) {
                        submissionsList.push(submissionsObj[exerciseId]);
                    }
                }
                return reply(
                    {
                        "data": submissionsList
                    }
                );
            });

    }


}

