"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Boom = require("boom");
const Jwt = require("jsonwebtoken");
const GoogleAuth = require("google-auth-library");
const _1 = require("../");
class UserController {
    constructor(configs, database) {
        this.database = database;
        this.configs = configs;
    }
    loginUser(request, reply) {
        let auth = new GoogleAuth;
        let client = new auth.OAuth2(this.configs.googleAuth.clientId, '', '');
        client.verifyIdToken(request.payload.idToken, this.configs.googleAuth.clientId, (e, login) => {
            let googleAuthPayload = login.getPayload();
            // Check if user has navgurukul.org eMail-ID.
            // Currently only NG students are allowed to access the platform.
            if (googleAuthPayload['hd'] !== 'navgurukul.org') {
                return reply(Boom.unauthorized("You need to have a navgurukul.org email to access this."));
            }
            _1.default('users').select().where('email', googleAuthPayload['email']).then((rows) => {
                // If a user does not exist then create a user and return the ID.
                if (rows.length === 0) {
                    // Check if the user needs to be created as a facilitator
                    let isFacilitator = this.configs.facilitatorEmails.indexOf(googleAuthPayload['email']) > -1 ? true : false;
                    return _1.default('users').insert({
                        email: googleAuthPayload['email'],
                        name: googleAuthPayload['name'],
                        profilePicture: googleAuthPayload['picture'],
                        googleUserId: googleAuthPayload['sub'],
                        facilitator: isFacilitator
                    }).then((response) => {
                        // return Promise.resolve({"hello": "123"});
                        return _1.default('users').select().where('email', googleAuthPayload['email']).then((rows) => {
                            let user = rows[0];
                            return Promise.resolve(user);
                        });
                    });
                }
                else {
                    let user = rows[0];
                    return Promise.resolve(user);
                }
            }).then((user) => {
                // Return the signed token & the user object             
                let token = Jwt.sign({ email: user.email, id: user.id }, "secret", { expiresIn: "24h" });
                return reply({
                    "user": user,
                    "jwt": token
                });
            });
        });
    }
    getUserInfo(request, reply) {
        _1.default.select('*').from('users').where('id', '=', request.params.userId).then(function (rows) {
            return reply(rows[0]);
        });
    }
    postUserNotes(request, reply) {
        let note = { 'student': request.params.userId, 'text': request.payload.text, 'facilitator': request.userId };
        _1.default.insert(note).into('notes').then((id) => {
            return reply({ id: id[0] });
        });
    }
    getUserNotes(request, reply) {
        _1.default.select().from('notes').where('student', request.params.userId).orderBy('createdAt', 'desc').then((rows) => {
            reply({ 'data': rows });
        });
    }
    deleteUserNoteById(request, reply) {
        _1.default('notes').where('id', request.params.noteId).del().then((rows, count) => {
            return reply({ success: true });
        });
    }
}
exports.default = UserController;
//# sourceMappingURL=user-controller.js.map