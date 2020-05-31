import * as Joi from "joi";

// Joi Schemas
export const courseInfoSchema:Joi.ObjectSchema = Joi.object({
    name: Joi.string().required(),
    type: Joi.string().allow('html', 'js', 'python').required(),
    days_to_complete: Joi.number().required().strict(false),
    short_description: Joi.string().required(),
    logo: Joi.string(),
});

export const exerciseInfoSchema:Joi.ObjectSchema =  Joi.object({
    name: Joi.string().required(),
    completionMethod: Joi.string().allow('manual', 'peer', 'facilitator', 'automatic'),
    submission_type: Joi.string().allow('number','text','text_large', 'url').default(null),
});
