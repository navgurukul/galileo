"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Joi = require("joi");
exports.courseSchema = Joi.object({
    id: Joi.number(),
    name: Joi.string(),
    type: Joi.string(),
    logo: Joi.number(),
});
exports.facilitatingCourseSchema = exports.courseSchema.keys({
    batch_name: Joi.string(),
    batch_id: Joi.number()
});
exports.enrolledCourseSchema = exports.courseSchema.keys({
    total_exercises: Joi.number()
});
exports.enrolledOrFacilitatingCourseSchema = exports.courseSchema.keys({
    enrolled: Joi.bool().allow(null),
    enrolledBatch: Joi.bool(),
    facilitatingFor: Joi.array().items(Joi.number()).allow(null)
        .description("IDs of batches for whom the user is a facilitator.")
});
let _exerciseSchema = Joi.object({
    id: Joi.number(),
    parentExercise: Joi.number().allow(null),
    courseId: Joi.number(),
    name: Joi.string(),
    slug: Joi.string(),
    sequenceNum: Joi.number(),
    reviewType: Joi.string(),
    content: Joi.string()
}).unknown();
exports.exerciseSchema = _exerciseSchema.keys({ childExercises: Joi.array().items(_exerciseSchema) });
//# sourceMappingURL=schemas.js.map