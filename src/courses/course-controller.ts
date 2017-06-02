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
    private user: any ;

    constructor(configs: IServerConfigurations, database: any) {
        this.database = database;
        this.configs = configs;
    }

    public getCoursesList(request: Hapi.Request, reply: Hapi.IReply) {  

        let facilitatingCourses = [];
        let enrolledCourses = [];
        let availableCourses = [];

        let enrolledQ = this.database('course_enrolments').select('courses.id', 'courses.name', 'courses.type', 
                'courses.logo', knex.raw('COUNT(exercises.id) as total_exercises'))
            .innerJoin('exercises', 'exercises.course_id', 'course_enrolments.course_id')
            .innerJoin('courses', 'course_enrolments.student_id', request.userId)
            .groupBy('courses.id')
            .then( (rows) => {
                enrolledCourses = rows;
                return Promise.resolve();
            });
        
        let facilitatingQ = this.database('courses')
            .select('courses.id', 'courses.name', 'courses.type', 'courses.logo', 'batches.name as batch_name', 'batches.id as batch_id')
            .join('batches', function(){
                this.on('courses.id', '=', 'batches.course_id').andOn('batches.facilitator_id', request.userId);
            }).then( (rows) => {
                facilitatingCourses = rows;
                return Promise.resolve();
            });
        

        let availableQ = database('courses').select('courses.id', 'courses.name', 'courses.type', 'courses.logo')
            .where('courses.id', 'not in', 
            database('courses').distinct().select('courses.id').join('batches', function(){
                this.on('courses.id', '=', 'batches.course_id').andOn('batches.facilitator_id', '=', request.userId);
            }).union(function(){
                this.select('courses.id').distinct().from('courses').join('course_enrolments', function(){
                    this.on('courses.id', '=', 'course_enrolments.course_id').andOn('course_enrolments.student_id', '=', request.userId);
                });
            })
        ).then( (rows) => {
            availableCourses = rows;
            return Promise.resolve();
        });

        Promise.all([facilitatingQ, enrolledQ, availableQ]).then(() => {
            return reply({
                "facilitatingCourses": facilitatingCourses,
                "enrolledCourses": enrolledCourses,
                "availableCourses": availableCourses
            });
        });

    }

    public getCourseExercises(request: Hapi.Request, reply: Hapi.IReply) {

        let exercises = [];
        database('exercises').select('*').where('courseId', request.params.courseId)
        .orderBy('sequenceNum', 'asc').then( (rows) => {
            for(let i = 0; i < rows.length; i++){
                let exercise = rows[i];
                if (exercise.sequenceNum % 1 !== 0){
                    let parentIndex = Number(String(exercise.sequenceNum).split('.')[0]) - 1;
                    exercises[parentIndex].childExercises.push(exercise);
                } else {
                    exercise.childExercises = [];
                    exercises.push(exercise);
                }
            }
            return reply({
                "data": exercises
            });
        });

    }

    public getExerciseById(request: Hapi.Request, reply: Hapi.IReply) {

        database('exercises').select('*').where('exerciseId', request.params.exerciseId)
        .then( (rows) => {
            let exercise = rows[0];
            return reply(exercise);
        });
        
    }

    public getCourseNotes(request: Hapi.Request, reply: Hapi.IReply) {

        database('courses').select('notes').where('id', request.params.courseId).then(function(rows){
            let notes = rows[0].notes;
            return reply({
                "notes": notes
            });
        });

    }

    public enrollInCourse(request: Hapi.Request, reply: Hapi.IReply) {

        database('course_enrolments').select('*').where({'studentId': request.userId, 'courseId': request.params.courseId})
        .then( (rows) => {
            if (rows.length > 0){
                return reply(Boom.expectationFailed("An enrolment against the user ID already exists."));
            } else {
                return Promise.resolve({noEnrolment: true});
            }
        })
        .then( () => {
            database('course_enrolments').insert({
                studentId: request.userId,
                courseId: request.params.courseId,
                batchId: this.configs.defaultBatchId
            }).then( (response) => {
                return reply({
                    "enrolled": true
                });
            });
        });

    }

}
