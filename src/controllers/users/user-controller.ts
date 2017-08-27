import * as Hapi from "hapi";
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
        this.userModel = new UserModel(this.configs);
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
                    return reply({
                        "user": user,
                        "jwt": this.userModel.getJWTToken(user)
                    });
                });
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
