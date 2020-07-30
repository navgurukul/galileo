import * as GoogleAuth from "google-auth-library";

import * as Hapi from "hapi";
import database from "../../";
import { IServerConfigurations } from "../../configurations";
// import { NotesModel } from "../../models/notes-model";

import { UserModel } from "../../models/user-model";
import { SelectLanguageModel } from "../../models/select-language-model";
import * as fs from "fs";
import * as Boom from "boom";   
import * as nconf from "nconf";

import * as Configs from "../../configurations";
const serverConfigs = Configs.getServerConfigs();

//Read Configurations
const config = new nconf.Provider({
    env: true,
    argv: true,
    store: {
        type: 'file',
        file: `/home/pralhad/Navgurukul/galileo/src/configurations/config.${process.env.GALILEO_ENV}.json`
    }
});

export default class UserController {
    private configs: IServerConfigurations;
    private database: any;
    private userModel: UserModel;
    private selectLanguageModel: SelectLanguageModel;
    // private notesModel: NotesModel;

    constructor(configs: IServerConfigurations, database: any) {
        this.database = database;
        this.configs = configs;
        this.userModel = new UserModel(this.configs);
        this.selectLanguageModel = new SelectLanguageModel(this.configs);
        // this.notesModel = new NotesModel(this.configs);


    }

    public loginUser(request, h) {
        let auth = new GoogleAuth;
        let client = new auth.OAuth2(this.configs.googleAuth.clientId, '', '');

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
                    profile_picture: googleAuthPayload['picture'],
                    google_user_id: googleAuthPayload['sub'],
                };


                this.userModel.upsert(userObj, { 'email': userObj['email'] }, true)
                    .then((user) => {


                        return database('user_roles').select('*')
                            .where({ 'user_roles.user_id': user.id })
                            .then((rows) => {

                                if (rows.length < 1) {
                                    // console.log(rows.length);

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


                        if (shouldCreateRole === true) {

                            // when the user signup for the first time or
                            // didn't have any user_roles


                            let userRoles = {
                                user_id: user.id

                            };
                            // if he/she is a facilitator
                            if (isFacilitator) {
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
                                        'user_roles.user_id': user.id,
                                        'user_roles.roles': 'facilitator',
                                        'user_roles.center': 'all'
                                    })
                                    .then((rows) => {

                                        // if user had been added as facilitator after joining SARAL
                                        if (rows.length < 1 && isFacilitator) {

                                            return Promise.resolve({ createFacilitatorRole: true });
                                        } else if (rows.length > 1 && !isFacilitator) {
                                            // if he/she has been removed as facilitator from
                                            // config file but is still a facilitator in the DB
                                            return database('user_roles').where({
                                                'user_roles.roles': 'facilitator',
                                                'user_roles.user_id': user.id,
                                                'user_roles.center': 'all'
                                            })
                                                .delete()
                                                .then(() => Promise.resolve({ createFacilitatorRole: false }));

                                        } else {
                                            return Promise.resolve({ createFacilitatorRole: false });
                                        }
                                    });
                            // NOTE: Need to create a route which grants roles to users

                            return shouldCreateFacilitatorRole
                                .then(({ createFacilitatorRole }) => {
                                    if (createFacilitatorRole === true) {
                                        // create the facilitator role for the user who is already
                                        // in the platform but have been added as facilitator in config file.

                                        return database('user_roles')

                                            .insert({
                                                'user_roles.user_id': user.id,
                                                'user_roles.roles': 'facilitator',
                                                'user_roles.center': 'all',
                                            })
                                            .then((rows) => Promise.resolve())



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
                                            'user_roles.user_id': user.id,
                                        });
                                })
                                .then((rows) => {

                                    // get the roles of the users
                                    for (let i = 0; i < rows.length; i++) {

                                        if (rows[i].roles === "facilitator") {
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
        });
    }

    public getUserInfo(request, h) {
        let id = request.params.userId;
        return new Promise((resolve, reject) => {
            this.userModel.findOne({ id: id }).then(obj => {

                resolve(obj);
            });
        });
    }

    /**
     * Update User details
     * @param request
     * @param h
     */
    public updateUserInfo(request, h) {
        let userDeatils = {
            github_link: request.payload.github_link,
            linkedin_link: request.payload.linkedin_link,
            medium_link: request.payload.medium_link,
            profile_picture: null
        };

        let that = this;

        return new Promise((resolve, reject) => {
            //

            let imageString = request.payload.uploadImage;
            let extension = undefined;
            let lowerCase = imageString.toLowerCase();
            if (lowerCase.indexOf("png") !== -1) extension = "png";
            else if (
                lowerCase.indexOf("jpg") !== -1 ||
                lowerCase.indexOf("jpeg") !== -1
            )
                extension = "jpg";
            else extension = "tiff";

            var base64Data = imageString.replace(
                /^data:image\/png;base64,/,
                ""
            );

            var imagepath =
                "img/avatar/avatar_" + request.user_id + "." + extension;

            fs.writeFile(imagepath, base64Data, "base64", function (err) {
                if (err) {
                    reject(
                        Boom.expectationFailed(
                            `There was a error at the time of image saving: ${err} `
                        )
                    );
                }

                var AWS = require("aws-sdk");
                var s3 = new AWS.S3();
                var myBucket = "saralng";

                fs.readFile(imagepath, function (err, data) {
                    if (err) {
                        reject(
                            Boom.expectationFailed(
                                `There was a error at the time of image reading: ${err} `
                            )
                        );
                    }

                    let contentType = "application/octet-stream";
                    if (
                        extension === "png" ||
                        extension === "jpg" ||
                        extension === "gif"
                    ) {
                        contentType = "image/" + extension;
                    }

                    var params = {
                        Bucket: myBucket,
                        Key: imagepath,
                        Body: data,
                        ContentType: contentType
                    };
                    s3.upload(params, function (err, data) {
                        if (err) {
                            reject(
                                Boom.expectationFailed(
                                    `There was a error at the time of S3 upload: ${err} `
                                )
                            );
                        } else {
                            //

                            userDeatils.profile_picture =
                                "https://s3.ap-south-1.amazonaws.com/saralng/" +
                                imagepath;
                            //
                            that.userModel
                                .upsert(
                                    userDeatils,
                                    { id: request.params.user_id },
                                    true
                                )
                                .then(user => {
                                    resolve({ user: user });
                                });
                        }
                    });
                });
            });
        });
    }
    // public postUserNotes(request, h) {
    //     let note = {
    //         student: request.params.userId,
    //         text: request.payload.text,
    //         facilitator: request.user_id
    //     };
    //     return new Promise((resolve, reject) => {
    //         this.notesModel.insert(note).then(status => {
    //             resolve({ status: status });
    //         });
    //     });
    // }

    // public getUserNotes(request, h) {
    //     return new Promise((resolve, reject) => {
    //         this.notesModel.getUserNotes(request.params.userId).then(rows => {
    //             resolve({ data: rows });
    //         });
    //     });
    // }

    // public deleteUserNoteById(request: Hapi.Request, reply: Hapi.IReply) {
    //     return new Promise((resolve, reject) => {
    //         this.notesModel.del(request.params.noteId).then(status => {
    //             resolve({ status: status });
    //         });
    //     });
    // }

    // Add or update users prefered language.
    public addUpdatePreferedLanguage(request, h) {
        const selectedLanguageObj = {
            user_id: request.params.userId,
            selected_language: request.payload.selected_language
        }
        
        return new Promise((resolve, rejects) => {
            this.selectLanguageModel.upsert(selectedLanguageObj, { 'user_id': selectedLanguageObj['user_id'] }, true)
            .then(() => {
                resolve({
                    'status': true 
                });
            }).catch(() => {
                resolve({
                    'status': false
                });
            });
        });
    }

    // get users prefered language.
    public getPreferedLnaguageInfo(request, h) {
        let user_id = request.params.userId;
        return new Promise((resolve, reject) => {
            this.selectLanguageModel.findOne({ user_id: user_id }).then(obj => {
                resolve(obj);
            });
        });
    }
    
    public getGitHubAccessUrl(request, h) {
        const email = request.params.email;
        const githubAccessKey = serverConfigs.githubAccess;
        return new Promise((resolve, reject) => {
            this.userModel.findOne({ email: email }).
                then(obj => {
                    const crypto = require('crypto');
                    const SCHOOL_ID = githubAccessKey.SCHOOL_ID; //configuration
                    const student_id = obj.id //fetch from db for email '%@navgurukul.org'
                    const SECRET_KEY = githubAccessKey.SECRET_KEY //configuration
                    const message_id = SCHOOL_ID.toString() + student_id.toString();
                    const hashDigest = crypto.
                        createHmac('sha256', SECRET_KEY).
                        update(message_id).
                        digest('hex');

                    const url = "https://education.github.com/student/verify?school_id=" + SCHOOL_ID + "&student_id=" + student_id + "&signature=" + hashDigest;

                    resolve({ "url": url });
                });
        });
    }
}
