import * as Joi from "joi";

export const courseSchema: Joi.ObjectSchema = Joi.object({
    id: Joi.number(),
    name: Joi.string(),
    type: Joi.string(),
    logo: Joi.string(),
    short_description: Joi.string(),
});

export const topicSchema: Joi.ObjectSchema = Joi.object({
    id: Joi.number(),
    name: Joi.string()
});

export const enrolledCourseSchema: Joi.ObjectSchema = courseSchema.keys({
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
export const completedCoursesSchema: Joi.ObjectSchema = courseSchema.keys({
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

let _exerciseSchema: Joi.ObjectSchema = Joi.object({
    // Exercise Specific
    id: Joi.number(),
    parent_exercise_id: Joi.number().allow(null),
    course_id: Joi.number(),
    name: Joi.string(),
    slug: Joi.string(),
    sequence_num: Joi.number(),
    review_type: Joi.string(),
    content: Joi.string(),
    submission_type: Joi.string().allow('number','text','text_large','attachments','url', null),
    github_link: Joi.string(),

    // NOTE: Commenting out as the feature is no longer required
    // the model of course was changing.
    // Submission specfic
    // submissionState: Joi.string().allow(null),
    // submissionId: Joi.number().allow(null),
    // submissionCompleteAt: Joi.date().allow(null)
}).unknown();

export const exerciseSchema = _exerciseSchema.keys({childExercises: Joi.array().items(_exerciseSchema)});
