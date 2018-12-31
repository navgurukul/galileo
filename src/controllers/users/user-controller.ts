import * as GoogleAuth from 'google-auth-library';
import * as Hapi from 'hapi';
import database from "../../";
import { IServerConfigurations } from '../../configurations';
import { NotesModel } from '../../models/notes-model';
import { UserModel } from '../../models/user-model';


export default class UserController {

    private configs: IServerConfigurations;
    private database: any;
    private userModel: UserModel;
    private notesModel: NotesModel;

    constructor(configs: IServerConfigurations, database: any) {
        this.database = database;
        this.configs = configs;
        this.userModel = new UserModel(this.configs);
        this.notesModel = new NotesModel(this.configs);
    }

    public loginUser(request, h) {
        // let auth = new GoogleAuth;
        // let client = new auth.OAuth2(this.configs.googleAuth.clientId, '', '');
        return new Promise((resolve, reject) => {

            // client.verifyIdToken(request.payload.idToken, this.configs.googleAuth.clientId, (error, login) => {
            //     if (error) {
            //         return console.error(error);
            //     }
            //     let googleAuthPayload = login.getPayload();
            //
            //     let isFacilitator = this.configs.facilitatorEmails.indexOf(googleAuthPayload['email']) > -1;
                let userObj = {
                    email: "ashok@gmail.com",//googleAuthPayload['email'],
                    name: "Ashok", //googleAuthPayload['name'],
                    profilePicture: "https://picture.com",//googleAuthPayload['picture'],
                    googleUserId: 123456789098765432,//googleAuthPayload['sub'],
                    facilitator: true,
                };
                this.userModel.upsert(userObj, {'email': userObj['email']}, true)
                    .then((user)=> {
                        console.log(user);
                        return database('user_roles').select('*')
                            .where({'userId': user.id})
                            .then((rows) => {
                                if(rows.length < 1) {
                                    return database('user_roles').insert({
                                        userId: user.id,
                                      })
                                      .then((row) => {
                                        return Promise.resolve({
                                          ...user,
                                          isAdmin:false
                                        });
                                      });
                                } else {
                                    const isAdmin = rows[0].roles ==='admin'?true:false;
                                    return Promise.resolve({
                                      ...user,
                                      isAdmin
                                    });
                                }
                            });
                    })
                    .then((user) => {
                         resolve({
                            'user': user,
                            'jwt': this.userModel.getJWTToken(user)
                        });
                    });
            });
        });
    }

    public getUserInfo(request, h) {
        let id = request.params.userId;
        return new Promise((resolve, reject) => {
            this.userModel.findOne({id: id})
                .then((obj) => {
                    resolve(obj);
                });
        });
    }

    public postUserNotes(request, h) {
        let note = {'student': request.params.userId, 'text': request.payload.text, 'facilitator': request.userId};
        return new Promise((resolve, reject) => {
            this.notesModel.insert(note)
                .then((status) => {
                    resolve({status: status});
                });
        });
    }

    public getUserNotes(request, h) {
        return new Promise((resolve, reject) => {
            this.notesModel.getUserNotes(request.params.userId)
                .then((rows) => {
                    resolve({data: rows});
                });
        });
    }

    public deleteUserNoteById(request: Hapi.Request, reply: Hapi.IReply) {
        return new Promise((resolve, reject) => {
            this.notesModel.del(request.params.noteId)
                .then((status) => {
                    resolve({status: status});
                });
        });

    }
}
