import * as Joi from "joi";

const _userSchema: Joi.ObjectSchema = Joi.object({
    id: Joi.number(),
    name: Joi.string(),
    email: Joi.string().email(),
    profilePicture: Joi.string().uri(),
});

export const menteesCourseReportSchema: Joi.ObjectSchema = Joi.object({
    courseId: Joi.number(),
    courseName: Joi.string(),
    isEnrolled: Joi.bool(),
    isCourseCompleted: Joi.bool(),
    studentEnrolled: Joi.array().items(_userSchema),
});

// const _submissionSchema: Joi.ObjectSchema = Joi.object({
//     submissionId: Joi.number().optional(),
//     submissionState: Joi.string().optional(),
//     submissionCompleted: Joi.bool().optional(),
//     menteeId: Joi.number().optional(),
//     menteeName: Joi.string().optional(),
//     menteeEmail: Joi.string().email().optional()
// })
//
// export const menteesExerciseReportSchema: Joi.ObjectSchema = Joi.object({
//     exerciseId : Joi.number(),
//     exerciseSlug : Joi.string(),
//     exerciseSequenceNum : Joi.number(),
//     exerciseName : Joi.string(),
//     exerciseSubmissionType : Joi.string(),
//     exerciseGithubLink : Joi.string().uri(),
//     exerciseContent : Joi.string(),
//     submissions : Joi.array().items(_submissionSchema).default([]),
// });
