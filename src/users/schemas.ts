import * as Joi from "joi";

export const userSchema:Joi.ObjectSchema = Joi.object({
    id: Joi.number(),
    batchID: Joi.number(),
    name: Joi.string(),
    email: Joi.string().email(),
    profilePicture: Joi.string().uri(),
    googleUserId:Joi.string(),
}).unknown();

export const noteSchema:Joi.ObjectSchema = Joi.object({
    id: Joi.number().required(),
    student:Joi.number().required(),
    text: Joi.string().required(),
    createdAt: Joi.date().required(),
    facilitator: Joi.number().required(),
});