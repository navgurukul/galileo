import * as Joi from "joi";

const _userSchema: Joi.ObjectSchema = Joi.object({
    id: Joi.number(),
    name: Joi.string(),
    email: Joi.string().email(),
    profilePicture: Joi.string().uri(),
});

export const menteesReportSchema: Joi.ObjectSchema = Joi.object({
    courseId: Joi.number(),
    courseName: Joi.string(),
    studentEnrolled: Joi.array().items(_userSchema),
});
