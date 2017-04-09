import * as Joi from "joi";

export const courseSchema:Joi.ObjectSchema = Joi.object({
    id: Joi.number().default(532),
    name: Joi.string().default("Primary Logic 101"),
    description: Joi.string().default("Primary Logic using Python 2.7"),
    totalExercises: Joi.number().default(123),
    daysToComplete: Joi.number().default(23)
                    .description("Number of days to complete the course. Excluding sundays.")
});

export const enrolledOrFacilitatingCourseSchema:Joi.ObjectSchema = courseSchema.keys({
    enrolled: Joi.bool().allow(null).default(false),
    facilitatingFor: Joi.array().items(Joi.number()).allow(null)
                     .description("IDs of batches for whom the user is a facilitator.")
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