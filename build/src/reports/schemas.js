"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Joi = require("joi");
const schemas_1 = require("../courses/schemas");
exports.exerciseReportSchema = schemas_1.exerciseSchema.keys({
    completionDetails: Joi.array().items(Joi.object({
        userId: Joi.number(),
        completed: Joi.bool().allow(null),
        completedOn: Joi.date().timestamp().allow(null),
        timeTakenToComplete: Joi.number().allow(null),
        attemptsTaken: Joi.number().allow(null)
    }))
});
//# sourceMappingURL=schemas.js.map