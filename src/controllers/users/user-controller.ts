import * as Hapi from "hapi";
import * as Jwt from "jsonwebtoken";
import * as GoogleAuth from "google-auth-library";

import database from "../../";
import {IServerConfigurations} from "../../configurations";
import {UserModel} from "../../models/user-model";


export default class UserController {

    private configs: IServerConfigurations;
    private database: any;
    private userModel: UserModel;

    constructor(configs: IServerConfigurations, database: any) {
        this.database = database;
        this.configs = configs;
        this.userModel = new UserModel();
    }

    public loginUser(request: Hapi.Request, reply: Hapi.IReply) {

        let auth = new GoogleAuth;
        let client = new auth.OAuth2(this.configs.googleAuth.clientId, '', '');
        client.verifyIdToken(request.payload.idToken, this.configs.googleAuth.clientId, (e, login) => {

            let googleAuthPayload = login.getPayload();

            let isFacilitator = this.configs.facilitatorEmails.indexOf(googleAuthPayload['email']) > -1;
            let userObj = {
                email: googleAuthPayload['email'],
                name: googleAuthPayload['name'],
                profilePicture: googleAuthPayload['picture'],
                googleUserId: googleAuthPayload['sub'],
                facilitator: isFacilitator
            };
            return this.userModel.upsert(userObj, {'email': userObj['email']}, true)
                .then((user) => {
                    // Return the signed token & the user object
                    let token = Jwt.sign({email: user.email, id: user.id}, "secret", {expiresIn: "24h"});
                    return reply({
                        "user": user,
                        "jwt": token
                    });
                });

            // database('users').select()
            //     .where('email', googleAuthPayload['email'])
            //     .then((rows) => {
            //         // If a user does not exist then create a user and return the ID.
            //         if (rows.length === 0) {
            //             // Check if the user needs to be created as a facilitator
            //
            //             return database('users').insert({}).then((response) => {
            //                 // return Promise.resolve({"hello": "123"});
            //                 return database('users').select().where('email', googleAuthPayload['email']).then((rows) => {
            //                     let user = rows[0];
            //                     return Promise.resolve(user);
            //                 });
            //             });
            //         }
            //         // If the user already exists
            //         else {
            //             let user = rows[0];
            //             return Promise.resolve(user);
            //         }
            //     })
            //     .then((user) => {
            //             // Return the signed token & the user object
            //             let token = Jwt.sign({email: user.email, id: user.id}, "secret", {expiresIn: "24h"});
            //             return reply({
            //                 "user": user,
            //                 "jwt": token
            //             });
            //         }
            //     );
        });

    }

    public getUserInfo(request: Hapi.Request, reply: Hapi.IReply) {
        let id = request.params.userId;
        return this.userModel.findOne({id: id})
            .then((obj) => {
                return reply(obj);
            });
    }

    public postUserNotes(request: Hapi.Request, reply: Hapi.IReply) {
        let note = {'student': request.params.userId, 'text': request.payload.text, 'facilitator': request.userId};
        database.insert(note).into('notes')
            .then((id) => {
                return reply({id: id[0]});
            });
    }

    public getUserNotes(request: Hapi.Request, reply: Hapi.IReply) {
        database('notes').select('notes.id', 'notes.text', 'notes.createdAt', 'users.name')
            .join('users', 'notes.facilitator', 'users.id')
            .where({
                'notes.student': request.params.userId
            })
            .then((rows) => {
                return reply({data: rows});
            });
    }

    public deleteUserNoteById(request: Hapi.Request, reply: Hapi.IReply) {

        database('notes').where('id', request.params.noteId).del().then((rows, count) => {
            return reply({success: true});
        });

    }

}
