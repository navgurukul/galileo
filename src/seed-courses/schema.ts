import * as Joi from "joi";

// Joi Schemas
export const courseInfoSchema:Joi.ObjectSchema = Joi.object({
    name: Joi.string().required(),
    type: Joi.string().allow('html', 'js', 'python').required(),
    short_description: Joi.string().required(),
    logo: Joi.string(),
});

export const exerciseInfoSchema:Joi.ObjectSchema =  Joi.object({
    name: Joi.string().required(),
    completionMethod: Joi.string().allow('manual', 'peer', 'facilitator', 'automatic'),
    submission_type: Joi.string().allow('number','text','text_large', 'url').default(null),
});
