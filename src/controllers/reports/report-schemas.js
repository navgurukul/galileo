"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exerciseReportSchema = exports.menteeSchema = exports.courseReportSchema = void 0;
const Joi = require("joi");
const menteeProgressSchema = Joi.object({
    menteeName: Joi.string(),
    menteeEmail: Joi.string().email(),
    menteeCourseStatus: Joi.string().allow('completed', 'enroll', 'unenroll'),
    completedSubmissions: Joi.number(),
    menteeId: Joi.number(),
});
exports.courseReportSchema = Joi.object({
    course_id: Joi.number(),
    courseName: Joi.string(),
    totalExercises: Joi.number(),
    studentEnrolled: Joi.array().items(menteeProgressSchema)
});
exports.menteeSchema = Joi.object({
    id: Joi.number(),
    name: Joi.string(),
    email: Joi.string().email()
});
const submissionSchema = Joi.object({
    submissionId: Joi.number(),
    submitter_notes: Joi.string(),
    submissionState: Joi.string().allow('completed', 'rejected', 'pending'),
    submissionCompleted: Joi.bool(),
    menteeId: Joi.number(),
    menteeName: Joi.string(),
    menteeEmail: Joi.string().email(),
});
exports.exerciseReportSchema = Joi.object({
    exercise_id: Joi.number(),
    exerciseSlug: Joi.string(),
    exerciseSequenceNum: Joi.number(),
    exerciseName: Joi.string(),
    exerciseSubmissionType: Joi.string().allow(null),
    exerciseGithubLink: Joi.string(),
    exerciseContent: Joi.string(),
    submissions: Joi.array().items(submissionSchema)
});
//# sourceMappingURL=report-schemas.js.map