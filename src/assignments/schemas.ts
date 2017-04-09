import * as Joi from "joi";

export const exerciseSubmissionPayload:Joi.ObjectSchema = Joi.object({
    manualDone: Joi.bool().default(true),
    files: Joi.array().items(Joi.string().uri())
          .description("List of URLs of submitted files"),
    notes: Joi.string().default("Some notes...."),
    userId: Joi.number().default(123)
            .description("ID of the user who made the submission.")
}).without('manualDone', ['files', 'notes']);

export const exerciseSubmission:Joi.ObjectSchema = exerciseSubmissionPayload.keys({
    id: Joi.number().default(98),
    submittedAt: Joi.date().timestamp()
});

export const peerReview:Joi.ObjectSchema = Joi.object({
    id: Joi.number().default(471),
    reviewerId: Joi.number().default(75),
    submissionId: Joi.number().default(12),
    approved: Joi.bool().default(true),
    notes: Joi.string().default()
});