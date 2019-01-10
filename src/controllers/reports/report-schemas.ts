import * as Joi from "joi";

const menteeProgressSchema: Joi.ObjectSchema = Joi.object({
    menteeName: Joi.string(),
    menteeEmail:Joi.string().email(),
    menteeCourseStatus: Joi.string().allow('completed', 'enroll', 'unenroll'),
    completedSubmissions: Joi.number(),
    menteeId: Joi.number(),
});

export const courseReportSchema: Joi.ObjectSchema = Joi.object({
    courseId: Joi.number(),
    courseName: Joi.string(),
    totalExercises: Joi.number(),
    studentEnrolled: Joi.array().items(menteeProgressSchema)
});


export const menteeSchema: Joi.ObjectSchema = Joi.object({
    id: Joi.number(),
    name: Joi.string(),
    email: Joi.string().email()
});

const submissionSchema: Joi.ObjectSchema = Joi.object({
    submissionId: Joi.number(),
    submissionState: Joi.string().allow('completed', 'rejected', 'pending'),
    submissionCompleted: Joi.bool(),
    menteeId: Joi.number(),
    menteeName: Joi.string(),
    menteeEmail: Joi.string().email(),
});

export const exerciseReportSchema: Joi.ObjectSchema = Joi.object({
    exerciseId: Joi.number(),
    exerciseSlug: Joi.string(),
    exerciseSequenceNum: Joi.number(),
    exerciseName: Joi.string(),
    exerciseSubmissionType: Joi.string().allow(null),
    exerciseGithubLink: Joi.string(),
    exerciseContent: Joi.string(),
    submissions: Joi.array().items(submissionSchema)
});
