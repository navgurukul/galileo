"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Boom = require("boom");
class TaskController {
    constructor(configs, database) {
        this.configs = configs;
        this.database = database;
    }
    createTask(request, reply) {
        let userId = request.auth.credentials.id;
        var newTask = request.payload;
        newTask.userId = userId;
        this.database.taskModel.create(newTask).then((task) => {
            reply(task).code(201);
        }).catch((error) => {
            reply(Boom.badImplementation(error));
        });
    }
    updateTask(request, reply) {
        let userId = request.auth.credentials.id;
        let id = request.params["id"];
        let task = request.payload;
        this.database.taskModel.findByIdAndUpdate({ _id: id, userId: userId }, { $set: task }, { new: true })
            .then((updatedTask) => {
            if (updatedTask) {
                reply(updatedTask);
            }
            else {
                reply(Boom.notFound());
            }
        }).catch((error) => {
            reply(Boom.badImplementation(error));
        });
    }
    deleteTask(request, reply) {
        let id = request.params["id"];
        let userId = request.auth.credentials.id;
        this.database.taskModel.findOneAndRemove({ _id: id, userId: userId }).then((deletedTask) => {
            if (deletedTask) {
                reply(deletedTask);
            }
            else {
                reply(Boom.notFound());
            }
        }).catch((error) => {
            reply(Boom.badImplementation(error));
        });
    }
    getTaskById(request, reply) {
        let userId = request.auth.credentials.id;
        let id = request.params["id"];
        this.database.taskModel.findOne({ _id: id, userId: userId }).lean(true).then((task) => {
            if (task) {
                reply(task);
            }
            else {
                reply(Boom.notFound());
            }
        }).catch((error) => {
            reply(Boom.badImplementation(error));
        });
    }
    getTasks(request, reply) {
        let userId = request.auth.credentials.id;
        let top = request.query.top;
        let skip = request.query.skip;
        this.database.taskModel.find({ userId: userId }).lean(true).skip(skip).limit(top).then((tasks) => {
            reply(tasks);
        }).catch((error) => {
            reply(Boom.badImplementation(error));
        });
    }
}
exports.default = TaskController;
//# sourceMappingURL=task-controller.js.map