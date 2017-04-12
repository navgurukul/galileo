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
        let requestPayload:any = request.payload;
        let auth = new GoogleAuth;
        let client = new auth.OAuth2(this.configs.googleAuth.clientId, '', '');
        client.verifyIdToken(requestPayload.idToken, this.configs.googleAuth.clientId, (e, login) => {
          let googleAuthPayload = login.getPayload();
          // Check if user has navgurukul.org eMail-ID
          if (googleAuthPayload['hd'] !== 'navgurukul.org') {
              return reply(Boom.unauthorized("You need to have a navgurukul.org email to access this."));
          }
        //   Check if a user with an email already exists
          this.database('users').select().where('email', googleAuthPayload['email']).then(
            (rows) => {
              if (rows.length === 0) {
                this.database('users').insert({email: googleAuthPayload['email'],
                name: googleAuthPayload['name'], profilePicture: googleAuthPayload['picture']}).then(
                  (response) => {
                    return Promise.resolve({
                      id:response[0],
                      email: googleAuthPayload['email']
                    });
                  }
                );
              } else {
                let user = rows[0];
                return Promise.resolve({id: user['id'], email: user['email']});
              }
          }
        ).then((res) => {
          let token = Jwt.sign({email: res.email, id: res.id}, "secret", {expiresIn: "24h"});
          console.log(token);
          return reply({"jwt": token});
        });
      });
    }

    public getUserInfo(request: Hapi.Request, reply: Hapi.IReply) {
        return reply({
            id: 5675,
            name: "Rahul",
            email: "rahul16@navgurukul.org",
            profilePic: "http://google.com/rahul_pic.png"
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
