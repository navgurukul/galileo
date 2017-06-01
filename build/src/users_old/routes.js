"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Joi = require("joi");
const user_model_1 = require("./user-model");
const user_controller_1 = require("./user-controller");
function default_1(server, serverConfigs, database) {
    const userController = new user_controller_1.default(serverConfigs, database);
    server.bind(userController);
    server.route({
        method: 'POST',
        path: '/users/auth/google',
        config: {
            handler: userController.loginUser,
            tags: ['api', 'login'],
            description: 'Login a user and generate jwt.',
            validate: {
                payload: Joi.object({
                    a: Joi.number(),
                    b: Joi.number()
                })
            },
        }
    });
    server.route({
        method: 'GET',
        path: '/users/auth',
        config: {
            handler: function (request, reply) {
                // console.log(request.hello);
                reply({ "text": "token is working" });
            },
            auth: 'jwt',
            validate: {}
        }
    });
    server.route({
        method: 'GET',
        path: '/assignment/{id*1}',
        config: {
            handler: function (request, reply) {
                let id = request.params.id;
                let userModel = new user_model_1.User();
                userModel.getAssignment(id).then((row) => {
                    return reply(row);
                });
            },
            auth: 'jwt',
            validate: {}
        }
    });
    server.route({
        method: 'POST',
        path: '/assignment/upload/{course*1}',
        config: {
            payload: {
                output: 'stream',
                parse: true,
                maxBytes: 52428800,
                allow: 'multipart/form-data',
            },
            handler: function (request, reply) {
                let gcs = require('@google-cloud/storage')({
                    projectId: 'saral-162810',
                    keyFilename: __dirname + '/../configurations/key.json'
                });
                let bucket = gcs.bucket('user-assignments');
                var fileData = request.payload.file;
                if (fileData) {
                    let dir = request.userId + '/' + request.params.course;
                    let name = fileData.hapi.filename;
                    let filePath = dir + '/' + name;
                    let file = bucket.file(filePath);
                    // console.log(file);
                    let stream = file.createWriteStream({
                        metadata: {
                            contentType: fileData.hapi.headers['content-type']
                        }
                    });
                    // stream.pipe(file);
                    // file.pipe();
                    stream.on('error', (err) => {
                        console.log(err);
                    });
                    stream.on('finish', () => {
                        console.log("gsddsfds");
                    });
                }
                reply('hey');
            },
            auth: 'jwt',
            validate: {},
        }
    });
}
exports.default = default_1;
//# sourceMappingURL=routes.js.map