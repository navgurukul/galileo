"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Boom = require("boom");
const knex = require("knex");
const _1 = require("../");
class CourseController {
    constructor(configs, database) {
        this.database = database;
        this.configs = configs;
    }
    getCoursesList(request, reply) {
        let facilitatingCourses = [];
        let enrolledCourses = [];
        let availableCourses = [];
        let enrolledQ = this.database('course_enrolments').select('courses.id', 'courses.name', 'courses.type', 'courses.logo', knex.raw('COUNT(exercises.id) as total_exercises'))
            .innerJoin('exercises', 'exercises.course_id', 'course_enrolments.course_id')
            .innerJoin('courses', 'course_enrolments.student_id', request.userId)
            .groupBy('courses.id')
            .then((rows) => {
            enrolledCourses = rows;
            return Promise.resolve();
        });
        let facilitatingQ = this.database('courses')
            .select('courses.id', 'courses.name', 'courses.type', 'courses.logo', 'batches.name as batch_name', 'batches.id as batch_id')
            .join('batches', function () {
            this.on('courses.id', '=', 'batches.course_id').andOn('batches.facilitator_id', request.userId);
        }).then((rows) => {
            facilitatingCourses = rows;
            return Promise.resolve();
        });
        let availableQ = _1.default('courses').select('courses.id', 'courses.name', 'courses.type', 'courses.logo')
            .where('courses.id', 'not in', _1.default('courses').distinct().select('courses.id').join('batches', function () {
            this.on('courses.id', '=', 'batches.course_id').andOn('batches.facilitator_id', '=', request.userId);
        }).union(function () {
            this.select('courses.id').distinct().from('courses').join('course_enrolments', function () {
                this.on('courses.id', '=', 'course_enrolments.course_id').andOn('course_enrolments.student_id', '=', request.userId);
            });
        })).then((rows) => {
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
    getCourseExercises(request, reply) {
        let exercises = [];
        _1.default('exercises').select('*').where('courseId', request.params.courseId)
            .orderBy('sequenceNum', 'asc').then((rows) => {
            for (let i = 0; i < rows.length; i++) {
                let exercise = rows[i];
                if (exercise.sequenceNum % 1 !== 0) {
                    let parentIndex = Number(String(exercise.sequenceNum).split('.')[0]) - 1;
                    exercises[parentIndex].childExercises.push(exercise);
                }
                else {
                    exercise.childExercises = [];
                    exercises.push(exercise);
                }
            }
            return reply({
                "data": exercises
            });
        });
    }
    getExerciseById(request, reply) {
        _1.default('exercises').select('*').where('exerciseId', request.params.exerciseId)
            .then((rows) => {
            let exercise = rows[0];
            return reply(exercise);
        });
    }
    getCourseNotes(request, reply) {
        _1.default('courses').select('notes').where('id', request.params.courseId).then(function (rows) {
            let notes = rows[0].notes;
            return reply({
                "notes": notes
            });
        });
    }
    enrollInCourse(request, reply) {
        _1.default('course_enrolments').select('*').where({ 'studentId': request.userId, 'courseId': request.params.courseId })
            .then((rows) => {
            if (rows.length > 0) {
                return reply(Boom.expectationFailed("An enrolment against the user ID already exists."));
            }
            else {
                return Promise.resolve({ noEnrolment: true });
            }
        })
            .then(() => {
            _1.default('course_enrolments').insert({
                studentId: request.userId,
                courseId: request.params.courseId,
                batchId: this.configs.defaultBatchId
            }).then((response) => {
                return reply({
                    "enrolled": true
                });
            });
        });
    }
}
exports.default = CourseController;
//# sourceMappingURL=course-controller.js.map