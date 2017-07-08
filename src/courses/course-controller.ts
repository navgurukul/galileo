import * as Hapi from "hapi";
import * as Boom from "boom";
import * as Jwt from "jsonwebtoken";
import * as Joi from "joi";
import * as knex from "knex";

import database from "../";
import { IServerConfigurations } from "../configurations";


export default class CourseController {

    private configs: IServerConfigurations;
    private database: any;
    private user: any;

    constructor(configs: IServerConfigurations, database: any) {
        this.database = database;
        this.configs = configs;
    }

    public getCoursesList(request: Hapi.Request, reply: Hapi.IReply) {

        let facilitatingCourses = [];
        let enrolledCourses = [];
        let availableCourses = [];

        let enrolledQ =
            database('course_enrolments')
                .select('courses.id', 'courses.name', 'courses.type', 'courses.logo', 'courses.daysToComplete',
                'courses.shortDescription', 'course_enrolments.enrolledAt', 'course_enrolments.batchId',
                database.raw('COUNT(exercises.id) as totalExercises'),
                database.raw('COUNT(DISTINCT submissions.id) as completedSubmissions'))
                .innerJoin('courses', 'course_enrolments.courseId', '=', 'courses.id')
                .innerJoin('exercises', 'course_enrolments.courseId', 'exercises.courseId')
                .leftJoin('submissions', function () {
                    this.on('submissions.userId', '=', request.userId)
                        .andOn('submissions.exerciseId', '=', 'exercises.id')
                        .andOn('submissions.completed', '=', 1);
                })
                .where({ 'course_enrolments.studentId': request.userId })
                .groupBy('exercises.courseId')
                .then((rows) => {
                    // console.log(rows);
                    enrolledCourses = rows;
                    let lastSubmissionQueries = [];
                    for (let i = 0; i < enrolledCourses.length; i++) {
                        let oneDay = 24 * 60 * 60 * 1000;
                        enrolledCourses[i].daysSinceEnrolled = Math.abs(+new Date() - enrolledCourses[i].enrolledAt) / oneDay;
                        lastSubmissionQueries.push(
                            database('submissions')
                                .select('exercises.name', 'exercises.slug', 'submissions.submittedAt', 'submissions.completedAt')
                                .innerJoin('exercises', 'submissions.exerciseId', 'exercises.id')
                                .innerJoin('courses', 'courses.id', 'exercises.courseId')
                                .where({ 'exercises.courseId': enrolledCourses[i].id, 'submissions.userId': request.userId })
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
                    return Promise.all(lastSubmissionQueries).then(() => {
                        return Promise.resolve();
                    });
                });

        let facilitatingQ =
            database('courses')
                .select('courses.id', 'courses.name', 'courses.type', 'courses.logo', 'courses.shortDescription',
                'batches.name as batch_name', 'batches.id as batchId')
                .join('batches', function () {
                    this.on('courses.id', '=', 'batches.courseId').andOn('batches.facilitatorId', request.userId);
                })
                .then((rows) => {
                    facilitatingCourses = rows;
                    return Promise.resolve();
                });


        let availableQ =
            database('courses').select('courses.id', 'courses.name', 'courses.type', 'courses.logo', 'courses.shortDescription')
                .where('courses.id', 'not in',
                database('courses').distinct().select('courses.id').join('batches', function () {
                    this.on('courses.id', '=', 'batches.courseId').andOn('batches.facilitatorId', '=', request.userId);
                })
                    .union(function () {
                        this.select('courses.id').distinct().from('courses').join('course_enrolments', function () {
                            this.on('courses.id', '=', 'course_enrolments.courseId')
                                .andOn('course_enrolments.studentId', '=', request.userId);
                        });
                    })
                ).then((rows) => {
                    availableCourses = rows;
                    return Promise.resolve();
                });

        Promise.all([facilitatingQ, enrolledQ, availableQ]).then(() => {
            return reply({
                "enrolledCourses": enrolledCourses,
                "facilitatingCourses": facilitatingCourses,
                "availableCourses": availableCourses
            });
        });

    }

    public getCourseExercises(request: Hapi.Request, reply: Hapi.IReply) {

        let exercises = [];
        let xyz = '(SELECT max(submissions.id) FROM submissions WHERE exerciseId = exercises.id ' 
        + 'AND userId = ' + request.userId + '  ORDER BY state ASC LIMIT 1)';
        database('exercises')
            .select('exercises.id', 'exercises.parentExerciseId', 'exercises.name', 'exercises.slug', 'exercises.sequenceNum',
            'exercises.reviewType', 'submissions.state as submissionState', 'submissions.id as submissionId',
            'submissions.completedAt as submissionCompleteAt', 'submissions.userId')
            .leftJoin('submissions', function () {
                this.on('submissions.id', '=',
                    knex.raw(xyz)
                ).on('submissions.userId', '=', request.userId);
            })
            .where({ 'exercises.courseId': request.params.courseId })
            .orderBy('exercises.sequenceNum', 'asc')
            .then((rows) => {
                for (let i = 0; i < rows.length; i++) {
                    let exercise = rows[i];
                    if (exercise.sequenceNum % 1 !== 0) {
                        let parentIndex = Number(String(exercise.sequenceNum).split('.')[0]) - 1;
                        exercises[parentIndex].childExercises.push(exercise);
                    } else {
                        exercise.childExercises = [];
                        exercises.push(exercise);
                    }
                }
                return reply({ data: exercises });
            });

    }

    public getExerciseById(request: Hapi.Request, reply: Hapi.IReply) {

        database('exercises')
            .select('exercises.id', 'exercises.parentExerciseId', 'exercises.name', 'exercises.slug', 'exercises.sequenceNum',
            'exercises.reviewType', 'exercises.content',
            'submissions.state as submissionState', 'submissions.id as submissionId', 'submissions.completedAt as submissionCompleteAt')
            .leftJoin('submissions', function () {
                this.on('submissions.id', '=',
                    database.raw('(SELECT max(submissions.id) FROM submissions WHERE exerciseId = exercises.id ORDER BY state ASC LIMIT 1)')
                );
            })
            .where({ 'exercises.id': request.params.exerciseId })
            .then((rows) => {
                let exercise = rows[0];
                return reply(exercise);
            });

    }

    public getExerciseBySlug(request: Hapi.Request, reply: Hapi.IReply) {
        let xyz = '(SELECT max(submissions.id) FROM submissions WHERE exerciseId = exercises.id ' + 
        'AND userId = ' + request.userId + '  ORDER BY state ASC LIMIT 1)';
        database('exercises')
            .select('exercises.id', 'exercises.parentExerciseId', 'exercises.name', 'exercises.slug', 'exercises.sequenceNum',
            'exercises.reviewType', 'exercises.content',
            'submissions.state as submissionState', 'submissions.id as submissionId', 'submissions.completedAt as submissionCompleteAt')
            .leftJoin('submissions', function () {
                this.on('submissions.id', '=',
                    database.raw(xyz)
                );
            })
            .where({ 'exercises.slug': request.query.slug })
            .then((rows) => {
                let exercise = rows[0];
                return reply(exercise);
            });
        // return 'het';
    }

    public getCourseNotes(request: Hapi.Request, reply: Hapi.IReply) {

        database('courses').select('notes').where('id', request.params.courseId).then(function (rows) {
            let notes = rows[0].notes;
            return reply({ "notes": notes });
        });

    }

    public enrollInCourse(request: Hapi.Request, reply: Hapi.IReply) {

        database('course_enrolments').select('*').where({ 'studentId': request.userId, 'courseId': request.params.courseId })
            .then((rows) => {
                if (rows.length > 0) {
                    reply(Boom.expectationFailed("An enrolment against the user ID already exists."));
                    return Promise.resolve({ alreadyEnrolled: true });
                } else {
                    return Promise.resolve({ alreadyEnrolled: false });
                }
            })
            .then((response) => {
                if (response.alreadyEnrolled === false) {
                    database('course_enrolments').insert({
                        studentId: request.userId,
                        courseId: request.params.courseId,
                        batchId: 1
                    }).then((response) => {
                        return reply({
                            "enrolled": true
                        });
                    });
                }
            });
    }

}
