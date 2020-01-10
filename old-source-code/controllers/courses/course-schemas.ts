import * as Joi from "joi";

export const courseSchema: Joi.ObjectSchema = Joi.object({
    id: Joi.number(),
    name: Joi.string(),
    type: Joi.string(),
    logo: Joi.string(),
    shortDescription: Joi.string(),
    sequenceNum: Joi.number().allow(null)
});

export const topicSchema: Joi.ObjectSchema = Joi.object({
    id: Joi.number(),
    name: Joi.string()
});

export const enrolledCourseSchema: Joi.ObjectSchema = courseSchema.keys({
    totalExercises: Joi.number(),
    completedSubmissions: Joi.number(),
    enrolledAt: Joi.date(),
    daysToComplete: Joi.number(),
    daysSinceEnrolled: Joi.number(),
    // batchId: Joi.number(),
    lastSubmission: Joi.object({
        name: Joi.string().allow(null),
        slug: Joi.string().allow(null),
        submittedAt: Joi.date().allow(null),
        completedAt: Joi.date().allow(null)
    }),
});
export const completedCoursesSchema: Joi.ObjectSchema = courseSchema.keys({
    completedAt: Joi.date().allow(null),
    enrolledAt: Joi.date(),
    daysToComplete: Joi.number(),
});
// export const enrolledOrFacilitatingCourseSchema: Joi.ObjectSchema = courseSchema.keys({
//     enrolled: Joi.bool().allow(null),
//     enrolledBatch: Joi.bool(),
//     facilitatingFor: Joi.array().items(Joi.number()).allow(null)
//         .description("IDs of batches for whom the user is a facilitator.")
// });
//

let _exerciseSchema: Joi.ObjectSchema = Joi.object({
    // Exercise Specific
    id: Joi.number(),
    parentExerciseId: Joi.number().allow(null),
    courseId: Joi.number(),
    name: Joi.string(),
    slug: Joi.string(),
    sequenceNum: Joi.number(),
    reviewType: Joi.string(),
    content: Joi.string(),
    submissionType: Joi.string().allow('number','text','text_large','attachments','url', null),
    githubLink: Joi.string(),

    // NOTE: Commenting out as the feature is no longer required
    // the model of course was changing.
    // Submission specfic
    // submissionState: Joi.string().allow(null),
    // submissionId: Joi.number().allow(null),
    // submissionCompleteAt: Joi.date().allow(null)
}).unknown();

export const exerciseSchema = _exerciseSchema.keys({childExercises: Joi.array().items(_exerciseSchema)});

export const courseSequenceSchema: Joi.ObjectSchema = Joi.object({
    id: Joi.number().required(),
    sequenceNum: Joi.number().required(),
});
