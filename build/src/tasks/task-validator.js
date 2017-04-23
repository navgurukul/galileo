"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Joi = require("joi");
exports.createTaskModel = Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().required()
});
exports.updateTaskModel = Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().required(),
    completed: Joi.boolean()
});
//# sourceMappingURL=task-validator.js.map