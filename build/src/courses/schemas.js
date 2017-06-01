"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Joi = require("joi");
exports.courseSchema = Joi.object({
    id: Joi.number(),
    name: Joi.string(),
    description: Joi.string(),
    totalExercises: Joi.number(),
    daysToComplete: Joi.number()
        .description("Number of days to complete the course. Excluding sundays.")
});
exports.enrolledOrFacilitatingCourseSchema = exports.courseSchema.keys({
    enrolled: Joi.bool().allow(null),
    enrolledBatch: Joi.bool(),
    facilitatingFor: Joi.array().items(Joi.number()).allow(null)
        .description("IDs of batches for whom the user is a facilitator.")
});
exports.exerciseSchema = Joi.object({
    id: Joi.number(),
    title: Joi.string(),
    slug: Joi.string(),
    content: Joi.string(),
    parentExercise: Joi.number().allow(null),
    completionType: Joi.string().valid('assignment', 'manual')
        .description("`assignment` if the student will have to finish an assignment or `manual` if not."),
    assignmentReviewType: Joi.string().valid("peer", "auto", "facilitator").allow(null)
        .description("`peer` will result in peer review, `auto` means now review and \
                                        `facilitator` will require a review from the facilitator.")
});
exports.enrolledExerciseSchema = exports.exerciseSchema.keys({
    completed: Joi.bool().allow(null),
    completedOn: Joi.date().timestamp().allow(null),
    timeTakenToComplete: Joi.number().allow(null)
        .description("Number of seconds taken to complete")
});
//# sourceMappingURL=schemas.js.map