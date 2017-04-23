"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Joi = require("joi");
const task_controller_1 = require("./task-controller");
const TaskValidator = require("./task-validator");
function default_1(server, configs, database) {
    const taskController = new task_controller_1.default(configs, database);
    server.bind(taskController);
    server.route({
        method: 'GET',
        path: '/tasks/{id}',
        config: {
            handler: taskController.getTaskById,
            // auth: "jwt",
            tags: ['api', 'tasks'],
            description: 'Get task by id.',
            validate: {
                params: {
                    id: Joi.string().required()
                },
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '200': {
                            'description': 'Task founded.'
                        },
                        '404': {
                            'description': 'Task does not exists.'
                        }
                    }
                }
            }
        }
    });
    server.route({
        method: 'GET',
        path: '/tasks',
        config: {
            handler: taskController.getTasks,
            // auth: "jwt",
            tags: ['api', 'tasks'],
            description: 'Get all tasks.',
            validate: {
                query: {
                    top: Joi.number().default(5),
                    skip: Joi.number().default(0)
                },
            }
        }
    });
    server.route({
        method: 'DELETE',
        path: '/tasks/{id}',
        config: {
            handler: taskController.deleteTask,
            // auth: "jwt",
            tags: ['api', 'tasks'],
            description: 'Delete task by id.',
            validate: {
                params: {
                    id: Joi.string().required()
                },
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '200': {
                            'description': 'Deleted Task.',
                        },
                        '404': {
                            'description': 'Task does not exists.'
                        }
                    }
                }
            }
        }
    });
    server.route({
        method: 'PUT',
        path: '/tasks/{id}',
        config: {
            handler: taskController.updateTask,
            // auth: "jwt",
            tags: ['api', 'tasks'],
            description: 'Update task by id.',
            validate: {
                params: {
                    id: Joi.string().required()
                },
                payload: TaskValidator.updateTaskModel,
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '200': {
                            'description': 'Deleted Task.',
                        },
                        '404': {
                            'description': 'Task does not exists.'
                        }
                    }
                }
            }
        }
    });
    server.route({
        method: 'POST',
        path: '/tasks',
        config: {
            handler: taskController.createTask,
            // auth: "jwt",
            tags: ['api', 'tasks'],
            description: 'Create a task.',
            validate: {
                payload: TaskValidator.createTaskModel,
            },
            plugins: {
                'hapi-swagger': {
                    responses: {
                        '201': {
                            'description': 'Created Task.'
                        }
                    }
                }
            }
        }
    });
}
exports.default = default_1;
//# sourceMappingURL=routes.js.map