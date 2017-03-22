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
            cors : true
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
        path: '/assignments/html',
        config: {
            handler: function(request, reply){
                let userModel = new User();
                userModel.getAssignments('html').then(
                    (rows) => {
                        return reply({'assignments': rows});
                    }
                );
            },
            auth: 'jwt',
            validate: {}
        }
    });

        server.route({
        method: 'GET',
        path: '/assignments/js',
        config: {
            handler: function(request, reply){
                let userModel = new User();
                userModel.getAssignments('js').then(
                    (rows) => {
                        return reply({'assignments': rows});
                    }
                );
            },
            auth: 'jwt',
            validate: {}
        }
    });

        server.route({
        method: 'GET',
        path: '/assignments/python',
        config: {
            handler: function(request, reply){
                let userModel = new User();
                userModel.getAssignments('python').then(
                    (rows) => {
                        return reply({'assignments': rows});
                    }
                );
            },
            auth: 'jwt',
            validate: {}
        },
    });

    server.route({
        method: 'POST',
        path: '/submit/html',
        config : {
            payload: {
            output: 'stream',
            parse: true,
            allow: 'multipart/form-data'
        },
            handler: function(request: Hapi.request, reply: Hapi.Ireply){
                // console.log(request.userId);
                // reply("hello");
                // var files = request.payload.files;
                // // console.log(request.payload.files);
                // let dir = __dirname + '/../../../uploads/' + request.userId + '/' + request.payload.name;
                // console.log("hey");
                // if (!fs.existsSync(dir)) {
                //     mkdirp(dir, (error) => {});
                // }
                // // console.log(files[0].hapi);
                // if (files) {
                //     for (let i = 0; i < files.length; i++) {
                //         let name = files[i].hapi.filename;
                //         let path = dir + '/' + name;
                //         let file = fs.createWriteStream(path);
                //         file.on('error', function (err) {
                //             console.log(err);
                //         });
                //         // fs.pipe(file);
                //     }
                // }
                // let userModel = new User();
                // userModel.submitAssignment(request.id, request.payload.name, dir);
                reply('hey');
            },
            auth: 'jwt',
            validate: {},
            cors : true
        }
    });

}