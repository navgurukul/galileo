"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Joi = require("joi");
exports.createUserModel = Joi.object().keys({
    email: Joi.string().email().trim().required(),
    name: Joi.string().required(),
    password: Joi.string().trim().required()
});
exports.updateUserModel = Joi.object().keys({
    email: Joi.string().email().trim(),
    name: Joi.string(),
    password: Joi.string().trim()
});
exports.loginUserModel = Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().trim().required()
});
exports.jwtValidator = Joi.object({ 'authorization': Joi.string().required() }).unknown();
//# sourceMappingURL=user-validator.js.map