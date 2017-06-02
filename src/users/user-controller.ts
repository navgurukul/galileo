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

        let auth = new GoogleAuth;
        let client = new auth.OAuth2(this.configs.googleAuth.clientId, '', '');
        client.verifyIdToken(request.payload.idToken, this.configs.googleAuth.clientId, (e, login) => {

            let googleAuthPayload = login.getPayload();

            // Check if user has navgurukul.org eMail-ID.
            // Currently only NG students are allowed to access the platform.
            if (googleAuthPayload['hd'] !== 'navgurukul.org') {
                return reply(Boom.unauthorized("You need to have a navgurukul.org email to access this."));
            }

            database('users').select().where('email', googleAuthPayload['email']).then((rows) => {
                // If a user does not exist then create a user and return the ID.
                if (rows.length === 0) {
                    // Check if the user needs to be created as a facilitator
                    let isFacilitator = this.configs.facilitatorEmails.indexOf(googleAuthPayload['email']) > -1 ? true : false;
                    return database('users').insert({
                        email: googleAuthPayload['email'],
                        name: googleAuthPayload['name'],
                        profilePicture: googleAuthPayload['picture'],
                        googleUserId: googleAuthPayload['sub'],
                        facilitator: isFacilitator
                    }).then((response) => {
                        // return Promise.resolve({"hello": "123"});
                        return database('users').select().where('email', googleAuthPayload['email']).then( (rows) => {
                            let user = rows[0];
                            return Promise.resolve(user);
                        });
                    });
                } 
                // If the user already exists
                else {
                    let user = rows[0];
                    return Promise.resolve(user);
                }
            }).then((user) => {
                // Return the signed token & the user object             
                let token = Jwt.sign({email: user.email, id: user.id}, "secret", {expiresIn: "24h"});
                return reply({
                    "user": user,
                    "jwt": token
                });
            });
        });

    }

    public getUserInfo(request: Hapi.Request, reply: Hapi.IReply) {

        database.select('*').from('users').where('id','=',request.params.userId).then(function(rows){
            return reply(rows[0]);
        });

    }

    public postUserNotes(request: Hapi.Request, reply: Hapi.IReply) {

        let note = { 'student': request.params.userId, 'text': request.payload.text, 'facilitator': request.userId };
        database.insert(note).into('notes').then((id) => {
            return reply({ id: id[0] });
        });

    }

    public getUserNotes(request: Hapi.Request, reply: Hapi.IReply) {
    
        database.select().from('notes').where('student', request.params.userId).orderBy('createdAt', 'desc').then((rows) => {
            reply({ 'data': rows });
        });

    }

    public deleteUserNoteById(request: Hapi.Request, reply: Hapi.IReply) {

        database('notes').where('id',request.params.noteId).del().then( (rows,count) => {
            return reply({ success: true });
        });

    }

}
