import * as Joi from "joi";

export const courseSchema:Joi.ObjectSchema = Joi.object({
    id: Joi.number(),
    name: Joi.string(),
    type: Joi.string(),
    logo: Joi.number(),
});

export const facilitatingCourseSchema:Joi.ObjectSchema = courseSchema.keys({
    batch_name: Joi.string(),
    batch_id: Joi.number()
});

export const enrolledCourseSchema:Joi.ObjectSchema = courseSchema.keys({
    total_exercises: Joi.number()
});

export const enrolledOrFacilitatingCourseSchema:Joi.ObjectSchema = courseSchema.keys({
    enrolled: Joi.bool().allow(null),
    enrolledBatch: Joi.bool(),
    facilitatingFor: Joi.array().items(Joi.number()).allow(null)
                     .description("IDs of batches for whom the user is a facilitator.")
});


let _exerciseSchema:Joi.ObjectSchema = Joi.object({
    id: Joi.number(),
    parentExercise: Joi.number().allow(null),
    courseId: Joi.number(),
    name: Joi.string(),
    slug: Joi.string(),
    sequenceNum: Joi.number(),
    reviewType: Joi.string(),
    content: Joi.string()
}).unknown();
export const exerciseSchema = _exerciseSchema.keys({ childExercises: Joi.array().items(_exerciseSchema) });