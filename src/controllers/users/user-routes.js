"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Joi = require("joi");
const user_controller_1 = require("./user-controller");
const user_schemas_1 = require("./user-schemas");
const Boom = require("boom");
function default_1(server, serverConfigs, database) {
    const userController = new user_controller_1.default(serverConfigs, database);
    server.bind(userController);
    server.route({
        method: 'POST',
        path: '/users/auth/google',
        config: {
            description: 'Get a JWT for a user using his short lived google access token.',
            validate: {
                payload: Joi.object({
                    idToken: Joi.string().required()
                        .description("Short lived access token provided by google web-sign in.")
                        .default("aaa.bbb.ccc")
                })
            },
            response: {
                schema: Joi.object({
                    "user": user_schemas_1.userSchema,
                    "jwt": Joi.string().required()
                        .default("xxx.yyy.zzz")
                        .description("Will authenticate all the future requests.")
                })
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '200': {
                            'description': 'User already existed and successfully authenticated.'
                        },
                        '201': {
                            'description': 'New user created and successfully authenticated.'
                        },
                        '401': {
                            'description': 'Auth failiure. Wrong ID token.'
                        }
                    }
                }
            },
            tags: ['api'],
            handler: userController.loginUser
        }
    });
    server.route({
        method: 'GET',
        path: '/users/{userId}',
        config: {
            description: 'Get user info by ID.',
            auth: 'jwt',
            validate: {
                params: {
                    userId: Joi.number().required(),
                }
            },
            response: {
                schema: user_schemas_1.userSchema
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '200': {
                            'description': 'User found.'
                        },
                        '404': {
                            'description': 'User not found.'
                        }
                    }
                }
            },
            tags: ['api'],
            handler: userController.getUserInfo,
        }
    });
    server.route({
        method: 'PUT',
        path: '/users/{userId}',
        config: {
            description: 'upadte user info by ID.',
            auth: 'jwt',
            validate: {
                params: {
                    userId: Joi.number().required(),
                },
                payload: {
                    github_link: Joi.string().regex(/(ftp|http|https):\/\/?(?:www\.)?github.com(\w+:{0,1}\w*@)?(\S+)(:([0-9])+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/).allow(null).uri(),
                    linkedin_link: Joi.string().regex(/(ftp|http|https):\/\/?(?:www\.)?linkedin.com(\w+:{0,1}\w*@)?(\S+)(:([0-9])+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/).allow(null).uri(),
                    medium_link: Joi.string().regex(/(ftp|http|https):\/\/?(?:www\.)?medium.com(\w+:{0,1}\w*@)?(\S+)(:([0-9])+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/).allow(null).uri(),
                    uploadImage: Joi.string().allow(null)
                },
                failAction: (request, h, err) => __awaiter(this, void 0, void 0, function* () {
                    throw Boom.badRequest(err.message);
                })
            },
            response: {
                schema: Joi.object({
                    "user": user_schemas_1.userSchema
                }),
                failAction: (request, h, err) => __awaiter(this, void 0, void 0, function* () {
                    return h.response({
                        "statusCode": 422,
                        "error": err.name,
                        "message": err.message
                    }).code(422);
                })
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '200': {
                            'description': 'User found.'
                        },
                        '404': {
                            'description': 'User not found.'
                        }
                    }
                }
            },
            tags: ['api'],
            handler: userController.updateUserInfo,
        }
    });
    server.route({
        method: 'GET',
        path: '/users/github/{email}',
        config: {
            description: 'Get GitHub access url',
            validate: {
                params: {
                    email: Joi.string().required(),
                },
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '200': {
                            'description': 'User found.'
                        },
                        '404': {
                            'description': 'User not found.'
                        }
                    }
                }
            },
            tags: ['api'],
            handler: userController.getGitHubAccessUrl,
        }
    });
}
exports.default = default_1;
//# sourceMappingURL=user-routes.js.map