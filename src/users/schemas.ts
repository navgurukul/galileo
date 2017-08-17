import * as Joi from "joi";

export const userSchema:Joi.ObjectSchema = Joi.object({
    id: Joi.number(),
    name: Joi.string(),
    email: Joi.string().email(),
<<<<<<< HEAD
    profilePic: Joi.string().uri(),
    role: Joi.string()
=======
    profilePicture: Joi.string().uri(),
    googleUserId: Joi.string(),
    facilitator: Joi.bool()
>>>>>>> f4eaec8c16f150fab25f8e234adf90ae88fd0856
});

export const noteSchema:Joi.ObjectSchema = Joi.object({
    id: Joi.number().required(),
    text: Joi.string().required(),
    createdAt: Joi.date().required(),
    name: Joi.string().required(),
});