"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exerciseSchema = exports.completedCoursesSchema = exports.enrolledCourseSchema = exports.topicSchema = exports.courseSchema = void 0;
const Joi = require("joi");
exports.courseSchema = Joi.object({
    id: Joi.number(),
    name: Joi.string(),
    type: Joi.string(),
    logo: Joi.string(),
    short_description: Joi.string(),
});
exports.topicSchema = Joi.object({
    id: Joi.number(),
    name: Joi.string()
});
exports.enrolledCourseSchema = exports.courseSchema.keys({
    totalExercises: Joi.number(),
    completedSubmissions: Joi.number(),
    enrolled_at: Joi.date(),
    days_to_complete: Joi.number(),
    daysSinceEnrolled: Joi.number(),
    // batchId: Joi.number(),
    lastSubmission: Joi.object({
        name: Joi.string().allow(null),
        slug: Joi.string().allow(null),
        submitted_at: Joi.date().allow(null),
        completed_at: Joi.date().allow(null)
    }),
});
exports.completedCoursesSchema = exports.courseSchema.keys({
    completed_at: Joi.date().allow(null),
    enrolled_at: Joi.date(),
    days_to_complete: Joi.number(),
});
// export const enrolledOrFacilitatingCourseSchema: Joi.ObjectSchema = courseSchema.keys({
//     enrolled: Joi.bool().allow(null),
//     enrolledBatch: Joi.bool(),
//     facilitatingFor: Joi.array().items(Joi.number()).allow(null)
//         .description("IDs of batches for whom the user is a facilitator.")
// });
//
let _exerciseSchema = Joi.object({
    // Exercise Specific
    id: Joi.number(),
    parent_exercise_id: Joi.number().allow(null),
    course_id: Joi.number(),
    name: Joi.string(),
    slug: Joi.string(),
    sequence_num: Joi.number(),
    review_type: Joi.string(),
    content: Joi.string(),
    submission_type: Joi.string().allow('number', 'text', 'text_large', 'attachments', 'url', null),
    github_link: Joi.string(),
}).unknown();
exports.exerciseSchema = _exerciseSchema.keys({ childExercises: Joi.array().items(_exerciseSchema) });
//# sourceMappingURL=course-schemas.js.map