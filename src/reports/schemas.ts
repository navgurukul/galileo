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

export const exerciseSchema:Joi.ObjectSchema = Joi.object({
    id: Joi.number().default(241),
    title: Joi.string().default("Adding 2 strings"),
    slug: Joi.string().default("adding-2-strings"),
    content: Joi.string().default("# Some heading \n ## Some sub-heading \n Some content."),
    parentExercise: Joi.number().allow(null).default(239),
    completionType: Joi.string().valid('assignment', 'manual')
                    .description("`assignment` if the student will have to finish an assignment or `manual` if not."),
    assignmentReviewType: Joi.string().valid("peer", "auto", "facilitator").allow(null)
                          .description("`peer` will result in peer review, `auto` means now review and \
                                        `facilitator` will require a review from the facilitator.")
});

export const enrolledExerciseSchema:Joi.ObjectSchema = exerciseSchema.keys({
    completed: Joi.bool().allow(null).default(false),
    completedOn: Joi.date().timestamp().allow(null),
    timeTakenToComplete: Joi.number().allow(null).default(3221)
                         .description("Number of seconds taken to complete")
});

export const exerciseReportSchema:Joi.ObjectSchema = exerciseSchema.keys({
    completionDetails: Joi.array().items(Joi.object({
        userId: Joi.number(),
        completed: Joi.bool().allow(null).default(false),
        completedOn: Joi.date().timestamp().allow(null),
        timeTakenToComplete: Joi.number().allow(null).default(3221),
        attemptsTaken: Joi.number().allow(null)
    }))
});