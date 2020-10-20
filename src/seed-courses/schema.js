"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exerciseInfoSchema = exports.courseInfoSchema = void 0;
const Joi = require("joi");
// Joi Schemas
exports.courseInfoSchema = Joi.object({
    name: Joi.string().required(),
    type: Joi.string().allow('html', 'js', 'python').required(),
    short_description: Joi.string().required(),
    logo: Joi.string(),
});
exports.exerciseInfoSchema = Joi.object({
    name: Joi.string().required(),
    completionMethod: Joi.string().allow('manual', 'peer', 'facilitator', 'automatic'),
    submission_type: Joi.string().allow('number', 'text', 'text_large', 'url').default(null),
});
//# sourceMappingURL=schema.js.map