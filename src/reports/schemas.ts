import * as Joi from "joi";

import { exerciseSchema } from '../courses/schemas';

export const exerciseReportSchema:Joi.ObjectSchema = exerciseSchema.keys({
    completionDetails: Joi.array().items(Joi.object({
        userId: Joi.number(),
        completed: Joi.bool().allow(null),
        completedOn: Joi.date().timestamp().allow(null),
        timeTakenToComplete: Joi.number().allow(null),
        attemptsTaken: Joi.number().allow(null)
    }))
});