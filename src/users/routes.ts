import * as Hapi from "hapi";
import * as Joi from "joi";
import { IServerConfigurations } from "../configurations";
import * as GoogleAuth from "google-auth-library";
import * as Boom from "boom";
import { User } from "./user-model";
import * as Jwt from "jsonwebtoken";

export default function (server: Hapi.Server, serverConfigs: IServerConfigurations, database: any) {

    // const userController = new UserController(serverConfigs, database);
    // server.bind(userController);

    server.route({
        method: 'POST',
        path: '/users/auth/google',
        config: {
            handler: function(request: Hapi.Request, reply: Hapi.IReply){
                let requestPayload:any = request.payload;
                let auth = new GoogleAuth;
                let client = new auth.OAuth2(serverConfigs.googleAuth.clientId, '', '');
                client.verifyIdToken(requestPayload.idToken, serverConfigs.googleAuth.clientId, function(e, login){

                    let googleAuthPayload = login.getPayload();

                    // Check if user has navgurukul.org eMail-ID
                    if (googleAuthPayload['hd'] !== 'navgurukul.org') {
                        reply(Boom.unauthorized("You need to have a navgurukul.org email to access this."));
                    }

                    // Check if a user with an email already exists
                    let userModel = new User();
                    userModel.getByEmail(googleAuthPayload['email']).then(
                        (rows) => {
                            console.log(rows);
                            if (rows.length === 0) {
                                userModel.create(googleAuthPayload['email'], googleAuthPayload['name'],
                                        googleAuthPayload['picture'], googleAuthPayload['sub']).then(
                                        (response) => {
                                            let token = Jwt.sign({email: googleAuthPayload['email']}, "secret", {expiresIn: "24h"});
                                            console.log(token);
                                            reply({"token": token});
                                        }
                                );
                            } else {
                                let user = rows[0];
                                let token = Jwt.sign({email: user['email']}, "secret", {expiresIn: "24h"});
                                console.log(token);
                                reply({"token": token});
                            }
                        }
                    );

                });
            },
            validate: {}
        }
    });

    server.route({
        method: 'GET',
        path: '/users/auth',
        config: {
            handler: function(request: Hapi.Request, reply: Hapi.IReply){
                reply({"text":"token is working"});
            },
            auth: 'jwt',
            validate: {}
        }
    });

}