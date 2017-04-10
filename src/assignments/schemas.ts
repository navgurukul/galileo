import * as Joi from "joi";

export const exerciseSubmissionPayload:Joi.ObjectSchema = Joi.object({
    manualDone: Joi.bool(),
    files: Joi.array().items(Joi.string().uri())
          .description("List of URLs of submitted files"),
    notes: Joi.string(),
    userId: Joi.number()
            .description("ID of the user who made the submission.")
}).without('manualDone', ['files', 'notes']);

export const exerciseSubmission:Joi.ObjectSchema = exerciseSubmissionPayload.keys({
    id: Joi.number(),
    submittedAt: Joi.date().timestamp()
});

export const peerReview:Joi.ObjectSchema = Joi.object({
    id: Joi.number(),
    reviewerId: Joi.number(),
    submissionId: Joi.number(),
    approved: Joi.bool(),
    notes: Joi.string()
});