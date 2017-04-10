import * as Joi from "joi";

export const userSchema:Joi.ObjectSchema = Joi.object({
    id: Joi.number().default(5675),
    batchId: Joi.number().default(12),
    name: Joi.string().default("Rahul"),
    email: Joi.string().email().default("rahul16@navgurukul.org"),
    profilePic: Joi.string().uri().default("http://google.com/rahul_pic.png")
});

export const noteSchema:Joi.ObjectSchema = Joi.object({
    id: Joi.number().required(),
    text: Joi.string().required(),
    createdAt: Joi.date().required(),
    createdBy: Joi.number().required()
});