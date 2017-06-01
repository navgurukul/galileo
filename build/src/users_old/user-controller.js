"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Boom = require("boom");
const GoogleAuth = require("google-auth-library");
const user_model_1 = require("./user-model");
class UserController {
    constructor(configs, database) {
        this.database = database;
        this.configs = configs;
        this.user = new user_model_1.User();
    }
    loginUser(request, reply) {
        let requestPayload = request.payload;
        let auth = new GoogleAuth;
        let client = new auth.OAuth2(this.configs.googleAuth.clientId, '', '');
        client.verifyIdToken(requestPayload.idToken, this.configs.googleAuth.clientId, (e, login) => {
            let googleAuthPayload = login.getPayload();
            // Check if user has navgurukul.org eMail-ID
            if (googleAuthPayload['hd'] !== 'navgurukul.org') {
                return reply(Boom.unauthorized("You need to have a navgurukul.org email to access this."));
            }
            // Check if a user with an email already exists
            let user = new user_model_1.User();
            user.getByEmail(googleAuthPayload['email']).then((rows) => {
                if (rows.length === 0) {
                    user.create(googleAuthPayload['email'], googleAuthPayload['name'], googleAuthPayload['picture'], googleAuthPayload['sub']).then((response) => {
                        return Promise.resolve({
                            id: response[0],
                            email: googleAuthPayload['email']
                        });
                    });
                }
                else {
                    let user = rows[0];
                    return Promise.resolve({ id: user['id'], email: user['email'] });
                }
            }).then((res) => {
                let token = user.generateJwtToken(res.email, res.id);
                console.log(token);
                return reply({ "token": token });
            });
        });
    }
}
exports.default = UserController;
//# sourceMappingURL=user-controller.js.map