import * as Hapi from "hapi";
import * as Boom from "boom";
import * as Jwt from "jsonwebtoken";
import * as GoogleAuth from "google-auth-library";

import database from "../";
import { IServerConfigurations } from "../configurations";


export default class UserController {

    private configs: IServerConfigurations;
    private database: any;
    private user: any ;

    constructor(configs: IServerConfigurations, database: any) {
        this.database = database;
        this.configs = configs;
    }

    public loginUser(request: Hapi.Request, reply: Hapi.IReply) {
        return reply({
            "jwt": Jwt.sign({email: "r@navgurukul.org", id: 12},
            "secret", {expiresIn: "24h"})
        });
    }

    public getUserInfo(request: Hapi.Request, reply: Hapi.IReply) {
        return reply({
            id: 5675,
            name: "Rahul",
            email: "rahul16@navgurukul.org",
            profilePic: "http://google.com/rahul_pic.png",
            batchId: "123",
            role: 'facilitator'
        });
    }

    public postUserNotes(request: Hapi.Request, reply: Hapi.IReply) {
        return reply({
            id: 241,
            text: "Kya aadmi hai yeh? Gazab!",
            createdAt: Date.now(),
            createdBy: 131
        });
    }

    public getUserNotes(request: Hapi.Request, reply: Hapi.IReply) {
        reply({
            "data": [
                {
                    id: 241,
                    text: "Kya aadmi hai yeh? Gazab!",
                    createdAt: Date.now(),
                    createdBy: 131
                },
                {
                    id: 1463,
                    text: "He has been kicking some ass lately!",
                    createdAt: Date.now(),
                    createdBy: 67
                },
                {
                    id: 453,
                    text: "He has been slacking off lately.",
                    createdAt: Date.now(),
                    createdBy: 131
                }
            ]
        });
    }

    public deleteUserNoteById(request: Hapi.Request, reply: Hapi.IReply) {
        return reply({
            id: 241,
            text: "Kya aadmi hai yeh? Gazab!",
            createdAt: Date.now(),
            createdBy: 131
        });
    }

}
