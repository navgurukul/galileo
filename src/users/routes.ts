import * as Hapi from "hapi";
import * as Joi from "joi";
import UserController from "./user-controller";
import * as UserValidator from "./user-validator";
// import { KnexDB } from "../database";
import { IServerConfigurations } from "../configurations";

export default function (server: Hapi.Server, serverConfigs: IServerConfigurations, database: any) {

    const userController = new UserController(serverConfigs, database);
    server.bind(userController);

    server.route({
        method: 'GET',
        path: '/users/info',
        config: {
            handler: userController.infoUser,
            tags: ['api', 'users'],
            description: 'Get user info.',
            validate: {
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '200': {
                            'description': 'User founded.'
                        },
                        '401': {
                            'description': 'Please login.'
                        }
                    }
                }
            }
        }
    });

    console.log('strategy');
    server.route({
        method: '*',
        path: '/bell/door',
        config: {
            auth: {
                strategy: 'google',
                mode: 'try'
            },
            handler: function (request, reply) {
                if (!request.auth.isAuthenticated) {
                    reply('Authentication failed due to: ' + JSON.stringify(request.auth));
                }
                // reply('<pre>' + JSON.stringify(request.auth.credentials, null, 4) + '</pre>');
            },
            tags: ['api', 'users'],
            description: 'Get user info.',
            validate: {
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '200': {
                            'description': 'User founded.'
                        },
                        '401': {
                            'description': 'Please login.'
                        }
                    }
                }
            }
        }
    });

    server.route({
        method: 'DELETE',
        path: '/users',
        config: {
            handler: userController.deleteUser,
            // auth: "jwt",
            tags: ['api', 'users'],
            description: 'Delete current user.',
            validate: {
                headers: UserValidator.jwtValidator
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '200': {
                            'description': 'User deleted.',
                        },
                        '401': {
                            'description': 'User does not have authorization.'
                        }
                    }
                }
            }
        }
    });

    server.route({
        method: 'PUT',
        path: '/users',
        config: {
            handler: userController.updateUser,
            // auth: "jwt",
            tags: ['api', 'users'],
            description: 'Update current user info.',
            validate: {
                payload: UserValidator.updateUserModel,
                headers: UserValidator.jwtValidator
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '200': {
                            'description': 'Updated info.',
                        },
                        '401': {
                            'description': 'User does not have authorization.'
                        }
                    }
                }
            }
        }
    });

    server.route({
        method: 'POST',
        path: '/users',
        config: {
            handler: userController.createUser,
            tags: ['api', 'users'],
            description: 'Create a user.',
            validate: {
                payload: UserValidator.createUserModel
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '201': {
                            'description': 'User created.'
                        }
                    }
                }
            }
        }
    });

    server.route({
        method: 'POST',
        path: '/users/login',
        config: {
            handler: userController.loginUser,
            tags: ['api', 'users'],
            description: 'Login a user.',
            validate: {
                payload: UserValidator.loginUserModel
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '200': {
                            'description': 'User logged in.'
                        }
                    }
                }
            }
        }
    });
}