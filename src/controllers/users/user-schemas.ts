import * as Joi from "joi";

export const userSchema: Joi.ObjectSchema = Joi.object({
    id: Joi.number(),
    name: Joi.string(),
    email: Joi.string().email(),
    profilePicture: Joi.string().uri(),
    googleUserId: Joi.string(),
    facilitator: Joi.bool(),
    isAdmin: Joi.bool(),
    center: Joi.string().allow(null),
    isAlumni: Joi.bool().allow(null).default(false),
});

export const noteSchema: Joi.ObjectSchema = Joi.object({
    id: Joi.number().required(),
    text: Joi.string().required(),
    createdAt: Joi.date().required(),
    name: Joi.string().required(),
});
