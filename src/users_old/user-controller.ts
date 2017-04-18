import * as Hapi from "hapi";
import * as Boom from "boom";
import * as Jwt from "jsonwebtoken";
import * as GoogleAuth from "google-auth-library";

import database from "../";
import { User } from "./user-model";
import { IServerConfigurations } from "../configurations";


export default class UserController {

    private configs: IServerConfigurations;
    private database: any;
    private user: any ;

    constructor(configs: IServerConfigurations, database: any) {
        this.database = database;
        this.configs = configs;
        this.user = new User();
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
          // Check if a user with an email already exists
          let user = new User();
          user.getByEmail(googleAuthPayload['email']).then(
            (rows) => {
              if (rows.length === 0) {
                user.create(googleAuthPayload['email'],
                googleAuthPayload['name'],
                googleAuthPayload['picture'],
                googleAuthPayload['sub']).then(
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
          let token = user.generateJwtToken(res.email, res.id);
          console.log(token);
          return reply({"token": token});
        });
      });
    }
}
