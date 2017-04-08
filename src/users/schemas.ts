import * as Joi from "joi";

export const userSchema:Joi.ObjectSchema = Joi.object({
    id: Joi.number().default(5675),
    name: Joi.string().default("Rahul"),
    email: Joi.string().email().default("rahul16@navgurukul.org"),
    profilePic: Joi.string().uri().default("http://google.com/rahul_pic.png")
});

export const noteSchema:Joi.ObjectSchema = Joi.object({
    id: Joi.number().default(241),
    text: Joi.string().default("Kya aadmi hai yeh? Gazab!"),
    createdAt: Joi.date().timestamp().default(Date.now()),
    createdBy: Joi.number().default(131)
});