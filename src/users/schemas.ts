import * as Joi from "joi";

export const userSchema:Joi.ObjectSchema = Joi.object({
    id: Joi.number(),
    batchId: Joi.number(),
    name: Joi.string(),
    email: Joi.string().email(),
    profilePic: Joi.string().uri(),
    role: Joi.string()
});

export const noteSchema:Joi.ObjectSchema = Joi.object({
    id: Joi.number().required(),
    text: Joi.string().required(),
    createdAt: Joi.date().required(),
    createdBy: Joi.number().required()
});