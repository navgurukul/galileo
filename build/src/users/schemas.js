"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Joi = require("joi");
exports.userSchema = Joi.object({
    id: Joi.number(),
    batchID: Joi.number(),
    name: Joi.string(),
    email: Joi.string().email(),
    profilePicture: Joi.string().uri(),
    googleUserId: Joi.string(),
    facilitator: Joi.bool()
});
exports.noteSchema = Joi.object({
    id: Joi.number().required(),
    student: Joi.number().required(),
    text: Joi.string().required(),
    createdAt: Joi.date().required(),
    facilitator: Joi.number().required(),
});
//# sourceMappingURL=schemas.js.map