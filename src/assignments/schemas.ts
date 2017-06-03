import * as Joi from "joi";

export const exerciseSubmission:Joi.ObjectSchema = Joi.object({
    id: Joi.number(),
    exerciseId: Joi.number(),
    userId: Joi.number(),
    submittedAt: Joi.date(),
    submitterNotes: Joi.string().allow(null),
    files: Joi.array().items(Joi.string().uri()).allow(null),
    notesReviewer: Joi.number().allow(null),
    state: Joi.string(),
    completed: Joi.bool(),
    completedAt: Joi.date().allow(null),
    // Reviewer Details
    reviwerName: Joi.string().allow(null),
    reviwerId: Joi.number().allow(null),
    reviewerProfilePicture: Joi.string().uri().allow(null),
    isReviewerFacilitator: Joi.bool().allow(null),
    // Submitter Details
    submitterName: Joi.string(),
    submitterId: Joi.number(),
    submitterProfilePicture: Joi.string().uri(),
    isSubmitterFacilitator: Joi.bool()
});

export const peerReviewSubmission:Joi.ObjectSchema = exerciseSubmission.keys({
    exerciseContent: Joi.string(),
    parentExerciseId: Joi.number().allow(null),
    courseId: Joi.number(),
    exerciseName: Joi.string(), 
    exerciseSlug: Joi.string(),
    exerciseSequenceNum: Joi.number(),
    reviewType: Joi.string(),
})