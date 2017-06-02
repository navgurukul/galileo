"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Joi = require("joi");
const user_controller_1 = require("./user-controller");
const schemas_1 = require("./schemas");
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
                    "user": schemas_1.userSchema,
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
                schema: schemas_1.userSchema
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
        method: 'POST',
        path: '/users/{userId}/notes',
        config: {
            description: 'Will be used by the facilitator to create a new note against a user.',
            auth: 'jwt',
            validate: {
                params: {
                    userId: Joi.number().required(),
                },
                payload: Joi.object({
                    text: Joi.string().required()
                })
            },
            response: {
                schema: {
                    id: Joi.number().required()
                }
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '201': {
                            'description': 'Note created successfully.'
                        }
                    }
                }
            },
            tags: ['api'],
            handler: userController.postUserNotes
        }
    });
    server.route({
        method: 'GET',
        path: '/users/{userId}/notes',
        config: {
            description: 'Get a list of notes (reverse chronologically sorted) of the user.',
            auth: 'jwt',
            validate: {
                params: {
                    userId: Joi.number().required(),
                }
            },
            response: {
                schema: Joi.object({
                    data: Joi.array().items(schemas_1.noteSchema)
                })
            },
            tags: ['api'],
            handler: userController.getUserNotes
        }
    });
    server.route({
        method: 'DELETE',
        path: '/users/{userId}/notes/{noteId}',
        config: {
            description: 'Delete a note of the user with a given ID',
            auth: 'jwt',
            validate: {
                params: {
                    userId: Joi.number().required(),
                    noteId: Joi.number().required(),
                }
            },
            response: {
                schema: Joi.object({
                    success: Joi.bool().required()
                })
            },
            tags: ['api'],
            handler: userController.deleteUserNoteById
        }
    });
}
exports.default = default_1;
//# sourceMappingURL=routes.js.map