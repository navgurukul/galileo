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

            database.select('*').from('users').where('id','=',request.params.userId).then(function(rows){
//                console.log(rows);
                return reply(rows[0]);
            });

    }

    public postUserNotes(request: Hapi.Request, reply: Hapi.IReply) {
        
       // console.log(request.params.userId);
       // console.log(request.payload.text);
   
        let mynotes=[{'student':request.params.userId,'text':request.payload.text,'facilitator':request.params.userId}];
        database.insert(mynotes).into('notes').then(function (id) {
            let entrynumber=id[0];
  return reply({
            id: entrynumber,
            text: request.payload.text,
            facilitator:request.params.userId,
            createdAt: Date.now(),
            student: request.params.userId,
        });

    });
}

    public getUserNotes(request: Hapi.Request, reply: Hapi.IReply) {

//console.log(request.params.userId);
database.select().from('notes').where('student','=',request.params.userId).then(function(rows){
  //  console.log(rows);
    reply({"data":rows});
});

    }

    public deleteUserNoteById(request: Hapi.Request, reply: Hapi.IReply) {
     //   console.log(request.params.userId);
       // console.log(request.params.noteId);

  
    database('notes').where("id",request.params.noteId).del().then(function (rows,count) {
  console.log(count);
});  
  reply({
      id:request.params.noteId,
      student:request.params.userId,
      facilitator:request.params.userId,
      createdAt:Date.now(),
      text:"Whats the use of displaying delted note"
  });
  
    }

}
