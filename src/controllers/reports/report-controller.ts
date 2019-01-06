import * as Hapi from "hapi";
import * as Boom from "boom";
import * as Jwt from "jsonwebtoken";
import * as GoogleAuth from "google-auth-library";

import database from "../../";
import {IServerConfigurations} from "../../configurations";
import { resolve } from "path";


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
                    resolve(
                        {
                            "data": submissionsList
                        }
                    );
                });
        });

    }



    public getMenteesCoursesReport(request, h){
        return new Promise((resolve, reject) => {
            database('mentors').select('*')
                  .where({
                    'mentors.mentor': 1 //request.userId
                  })
                  .then((rows) => {
                      if (rows.length < 1){
                        reject(Boom.expectationFailed("User doesn't have any mentee."));
                      } else {
                          let mentees = [],
                              course_enrolments = [];
                          let menteesQuery = database('users')
                                      .select('users.id', 'users.name', 'users.email')
                                      .innerJoin('mentors', 'mentors.mentee', 'users.id')
                                      .where({
                                          'mentors.mentor': 1 //request.userId
                                      })
                                      .then((rows) => {
                                          mentees = rows;
                                      });
                          // get all the courses where the mentors menties have enrolled
                          let menteesReportQuery = database('course_enrolments')
                                      .select('courses.name as courseName','courses.id as courseId',
                                              'users.id', 'users.name', 'users.email',
                                              'course_enrolments.enrolled as isEnrolled', 'course_enrolments.completed as isCourseCompleted ')
                                      .innerJoin('courses', 'courses.id' , 'course_enrolments.courseId')
                                      .rightJoin('mentors', 'course_enrolments.studentId', 'mentors.mentee')
                                      .innerJoin('users', 'users.id', 'mentors.mentee')
                                      .where({
                                          'mentors.mentor': 1 //request.userId
                                      })
                                      .distinct('users.id')
                                      .then((rows) => {
                                        course_enrolments = rows;
                                      });
                          // Add mentee list to be also sent
                          Promise.all([menteesReportQuery, menteesQuery]).then(() => {

                              // arranging student according to courses
                              let courses = {};
                              for(let i = 0; i < course_enrolments.length-1 ; i++){
                                  const { courseName, courseId, ...userDetails } = course_enrolments[i];

                                  if (courses[courseName] === undefined){
                                      courses[courseName] = {
                                        courseId,
                                        studentEnrolled:[],
                                      };
                                  }
                                  courses[courseName]['studentEnrolled'].push(userDetails);
                                }

                              let enrolledCoursesReport = [];
                              for(let courseName of Object.keys(courses)){
                                let courseReport = {
                                  courseName,
                                  ...courses[courseName]
                                }
                                enrolledCoursesReport.push(courseReport);
                              }

                              resolve({
                                "data":enrolledCoursesReport,
                                "userList":mentees,
                              });
                          });
                      }
                });
        });
    }


    public getMenteesExercisesReport(request, h){
      return new Promise((resolve, reject) => {
        database('mentors').select('*')
            .where({'mentors.mentor': request.userId})
            .then(rows => {
                if (rows.length < 1){
                  reject(Boom.expectationFailed("User doesn't have any mentee"));
                } else {
                  database('courses')
                      .select('courses.id as courseId')
                      .where({
                          'courses.id': request.params.courseId
                      })
                      .then((rows) => {
                          // what if the courseId doesn't exist
                          if (rows.length < 1){
                              return reject(Boom.expectationFailed("CourseId doesn't exist please check the id."));
                          } else{
                              return Promise.resolve({courseId: rows[0].courseId})
                          }

                      })
                      .then(({ courseId }) => {
                          let mentees = [],
                              menteeSubmissions = [],
                              exercises = {};
                          let menteesQuery = database('users')
                                  .select('users.id', 'users.name', 'users.email')
                                  .innerJoin('mentors', 'mentors.mentee', 'users.id')
                                  .where({
                                      'mentors.mentor': request.userId
                                  })
                                  .then((rows) => {
                                      mentees = rows;
                                  });
                          let exerciseQuery =
                                database('exercises')
                                    .select(
                                      'exercises.id as exerciseId', 'exercises.slug as exerciseSlug',
                                      'exercises.sequenceNum as exerciseSequenceNum', 'exercises.name as exerciseName', 'exercises.submissionType as exerciseSubmissionType', 'exercises.githubLink as exerciseGithubLink', 'exercises.content as exerciseContent')
                                    .where({
                                        'exercises.courseId': courseId
                                    })
                                    .orderBy('exercises.sequenceNum', 'asc')
                                    .then((rows) => {
                                        for(let i = 0; i < rows.length; i++){
                                            let exercise = rows[i];
                                            exercises[exercise.exerciseId] = exercise;
                                            exercises[exercise.exerciseId]['submissions'] = []
                                        }
                                    });

                          Promise.all([menteesQuery, exerciseQuery]).then(() => {
                                database('submissions')
                                    .select(
                                        'submissions.id as submissionId', 'submissions.state as submissionState',
                                        'submissions.completed as submissionCompleted', 'submissions.exerciseId as exerciseId',
                                        'users.id as menteeId', 'users.name as menteeName', 'users.email as menteeEmail'
                                    )
                                    .innerJoin('exercises', 'exercises.id', 'submissions.exerciseId')
                                    .innerJoin('mentors', 'mentors.mentee', 'submissions.userId')
                                    .innerJoin('users', 'users.id', 'mentors.mentee')
                                    .where({
                                        'exercises.courseId': courseId,
                                        'mentors.mentor':request.userId
                                    })
                                    .then((rows) => {
                                        console.log(rows);
                                        // arrange the submissions of users exercise wise in exercises;
                                        for(let i = 0; i < rows.length; i++){
                                            let { exerciseId, ...submission } = rows[i];
                                            exercises[exerciseId]['submissions'].push(submission)
                                        }
                                        // convert exercises from dictionary to list sorted by sequenceNum
                                        for(let exerciseId of Object.keys(exercises)){
                                            menteeSubmissions.push(exercises[exerciseId]);
                                        }
                                        menteeSubmissions.sort(function(a, b){
                                          return a.exerciseSequenceNum - b.exerciseSequenceNum;
                                        })
                                        // console.log(exercises);
                                        resolve({
                                            "data": menteeSubmissions,
                                            "userList": mentees,
                                        });

                                    });
                              });
                      });
                }
            });

      });
    }
}
