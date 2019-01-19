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

            client.verifyIdToken(request.payload.idToken, this.configs.googleAuth.clientId, (error, login) => {
                if (error) {
                    return console.error(error);
                }
                let googleAuthPayload = login.getPayload();

                let isFacilitator = this.configs.facilitatorEmails.indexOf(googleAuthPayload['email']) > -1;
                let isAdmin = false,
                    isAlumni = false;

                let userObj = {
                    email: googleAuthPayload['email'],
                    name: googleAuthPayload['name'],
                    profilePicture: googleAuthPayload['picture'],
                    googleUserId: googleAuthPayload['sub'],
                };

                this.userModel.upsert(userObj, {'email': userObj['email']}, true)
                    .then((user) => {
                        return database('user_roles').select('*')
                                  .where({'user_roles.userId':user.id})
                                  .then((rows) => {
                                      if(rows.length < 1){
                                          return Promise.resolve({
                                              shouldCreateRole: true,
                                              user
                                          });
                                      } else {
                                          return Promise.resolve({
                                              shouldCreateRole: false,
                                              user
                                          });
                                      }
                                  });
                    })
                    .then((response) => {
                        const { shouldCreateRole, user } = response;

                        if(shouldCreateRole === true){
                            // when the user signup for the first time or
                            // didn't have any user_roles
                            let userRoles = {
                                userId: user.id
                            };
                            // if he/she is a facilitator
                            if(isFacilitator){
                                userRoles['roles'] = 'facilitator';
                                userRoles['center'] = 'all';
                            };

                            return database('user_roles').insert(userRoles)
                                      .then(() => {
                                          return Promise.resolve({
                                              ...user,
                                              isAdmin,
                                              isFacilitator,
                                              isAlumni,
                                          });
                                      });

                        } else {
                            // update the facilitator from config files
                            let shouldCreateFacilitatorRole =
                                    database('user_roles').select('*')
                                        .where({
                                            'user_roles.userId': user.id,
                                            'user_roles.roles': 'facilitator',
                                            'user_roles.center': 'all'
                                        })
                                        .then((rows) => {
                                            // if user had been added as facilitator after joining SARAL
                                            if(rows.length < 1 && isFacilitator){
                                                return Promise.resolve({createFacilitatorRole: true});
                                            } else if (rows.length > 1 && !isFacilitator){
                                                // if he/she has been removed as facilitator from
                                                // config file but is still a facilitator in the DB
                                                return database('user_roles').where({
                                                    'user_roles.roles':'facilitator',
                                                    'user_roles.userId': user.id,
                                                    'user_roles.center': 'all'
                                                })
                                                .delete()
                                                .then(() => Promise.resolve({createFacilitatorRole: false}));

                                            } else {
                                                return Promise.resolve({createFacilitatorRole: false});
                                            }
                                        });
                            // NOTE: Need to create a route which grants roles to users

                            return shouldCreateFacilitatorRole
                                      .then(({createFacilitatorRole}) => {
                                          if(createFacilitatorRole === true){
                                            // create the facilitator role for the user who is already
                                            // in the platform but have been added as facilitator in config file.
                                              return database('user_roles')
                                                        .insert({
                                                            'user_roles.userId': user.id,
                                                            'user_roles.roles': 'facilitator',
                                                            'user_roles.center': 'all',
                                                        })
                                                        .then((rows) => Promise.resolve());

                                          } else {
                                              // TODO: just update the user_roles values.
                                              return Promise.resolve();
                                          }
                                      })
                                      .then(() => {
                                          // get all the roles the user have
                                          return database('user_roles')
                                                    .select('*')
                                                    .where({
                                                        'user_roles.userId': user.id,
                                                    });
                                      })
                                      .then((rows) => {
                                            // get the roles of the users
                                            for(let i = 0; i < rows.length; i++){
                                                if (rows[i].roles === "facilitator"){
                                                    isFacilitator = true;
                                                } else if (rows[i].roles === "admin") {
                                                    isAdmin = true;
                                                } else if (rows[i].roles === "alumni") {
                                                    isAlumni = true;
                                                }
                                            }

                                            return Promise.resolve({
                                                ...user,
                                                isFacilitator,
                                                isAdmin,
                                                isAlumni,
                                            });
                                      });
                        }
                    })
                    .then((user) => {
                        resolve({
                            'user': user,
                            'jwt': this.userModel.getJWTToken(user)
                        });
                    });
            });
        // });
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
