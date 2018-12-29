import * as Joi from "joi";

// Joi Schemas
export const courseInfoSchema:Joi.ObjectSchema = Joi.object({
    name: Joi.string().required(),
    type: Joi.string().allow('html', 'js', 'python').required(),
    daysToComplete: Joi.number().required().strict(false),
    shortDescription: Joi.string().required(),
    logo: Joi.string(),
    facilitator: Joi.number().allow(null)
});

export const exerciseInfoSchema:Joi.ObjectSchema =  Joi.object({
    name: Joi.string().required(),
    completionMethod: Joi.string().allow('manual', 'peer', 'facilitator', 'automatic'),
    submissionType: Joi.string().allow('number','text','text_large', 'url').default(null),
});
