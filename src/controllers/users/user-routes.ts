import * as Hapi from "hapi";
import * as Joi from "joi";
import { IServerConfigurations } from "../../configurations";

import UserController from "./user-controller";
import { noteSchema, userSchema } from "./user-schemas";

export default function (server: Hapi.Server, serverConfigs: IServerConfigurations, database: any) {

    const userController = new UserController(serverConfigs, database);
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
                    "user": userSchema,
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
                schema: userSchema
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
                    githubLink: Joi.string().allow(null).uri(),
                    linkedinLink: Joi.string().allow(null).uri(),
                    mediumLink: Joi.string().allow(null).uri(),
                    uploadImage:Joi.string().allow(null)
                }

            },
            // response: {
            //     user: userSchema
            // },
            response: {

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
                    status: Joi.bool().required()
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
                    data: Joi.array().items(noteSchema)
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
                    status: Joi.bool().required()
                })
            },
            tags: ['api'],
            handler: userController.deleteUserNoteById
        }
    });

}
