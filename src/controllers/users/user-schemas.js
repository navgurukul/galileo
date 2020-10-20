"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoleSchema = exports.userSchema = void 0;
const Joi = require("joi");
exports.userSchema = Joi.object({
    id: Joi.number(),
    name: Joi.string(),
    email: Joi.string().email(),
    profile_picture: Joi.string().uri(),
    google_user_id: Joi.string(),
    isFacilitator: Joi.bool(),
    isAdmin: Joi.bool(),
    isAlumni: Joi.bool().allow(null).default(false),
    center: Joi.string().allow(null),
    created_at: Joi.date().allow(null),
    github_link: Joi.string().regex(/(ftp|http|https):\/\/?(?:www\.)?github.com(\w+:{0,1}\w*@)?(\S+)(:([0-9])+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/).allow(null).uri(),
    linkedin_link: Joi.string().regex(/(ftp|http|https):\/\/?(?:www\.)?linkedin.com(\w+:{0,1}\w*@)?(\S+)(:([0-9])+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/).allow(null).uri(),
    medium_link: Joi.string().regex(/(ftp|http|https):\/\/?(?:www\.)?medium.com(\w+:{0,1}\w*@)?(\S+)(:([0-9])+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/).allow(null).uri(),
    chat_id: Joi.string(),
    chat_password: Joi.string()
});
exports.userRoleSchema = Joi.object({
    id: Joi.number(),
    name: Joi.string(),
    email: Joi.string().email(),
    profile_picture: Joi.string().uri().allow(null),
    google_user_id: Joi.string(),
    roles: Joi.string(),
    center: Joi.string(),
    mentor: Joi.allow(null),
    mentee: Joi.number().allow(null),
});
//# sourceMappingURL=user-schemas.js.map