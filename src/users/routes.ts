import * as Hapi from "hapi";
import * as Joi from "joi";
import { IServerConfigurations } from "../configurations";
import * as GoogleAuth from "google-auth-library";
import * as Boom from "boom";
import { User } from "./user-model";
import * as Jwt from "jsonwebtoken";
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import UserController from "./user-controller";
// var gcs = require('@google-clowud/storage')();
// import * as gcs from '@google-cloud/storage';

// const Storage = require('@google-cloud/storage');
// const CLOUD_BUCKET = 'user-assignments';

// const storage = Storage({
//   projectId: 'saral-162810',
// //   keyFilename: '../configurations/key.json',
//   credentials: require('../configurations/key.json')
// });
// const bucket = storage.bucket(CLOUD_BUCKET);

export default function (server: Hapi.Server, serverConfigs: IServerConfigurations, database: any) {

    const userController = new UserController(serverConfigs, database);
    server.bind(userController);

    server.route({
        method: 'POST',
        path: '/users/auth/google',
        config: {
            handler: userController.loginUser,
            tags: ['api', 'login'],
            description: 'Login a user and generate jwt.',
            validate: {},
            // cors : true
        }
    });

    server.route({
        method: 'GET',
        path: '/users/auth',
        config: {
            handler: function(request: Hapi.Request, reply: Hapi.IReply){
                // console.log(request.hello);
                reply({"text":"token is working"});
            },
            auth: 'jwt',
            validate: {}
        }
    });

    server.route({
        method: 'GET',
        path: '/assignment/{id*1}',
        config: {
            handler: function(request, reply) {
                let id = request.params.id;
                let userModel = new User();
                userModel.getAssignment(id).then(
                    (row) => {
                        return reply(row);
                    }
                );
            },
            auth: 'jwt',
            validate: {}
        }
    });

    server.route({
        method: 'POST',
        path: '/assignment/upload/{course*1}',
        config : {
            payload: {
            output: 'stream',
            parse: true,
            maxBytes: 52428800,
            allow: 'multipart/form-data',
        },
            handler: function(request: Hapi.request, reply: Hapi.Ireply){
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