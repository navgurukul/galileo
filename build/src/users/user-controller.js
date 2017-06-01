"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Jwt = require("jsonwebtoken");
const _1 = require("../");
class UserController {
    constructor(configs, database) {
        this.database = database;
        this.configs = configs;
    }
    loginUser(request, reply) {
        return reply({
            "jwt": Jwt.sign({ email: "r@navgurukul.org", id: 12 }, "secret", { expiresIn: "24h" })
        });
    }
    getUserInfo(request, reply) {
        _1.default.select('*').from('users').where('id', '=', request.params.userId).then(function (rows) {
            return reply(rows[0]);
        });
    }
    postUserNotes(request, reply) {
        let mynotes = [{ 'student': request.params.userId, 'text': request.payload.text, 'facilitator': request.params.userId }];
        _1.default.insert(mynotes).into('notes').then(function (id) {
            let entrynumber = id[0];
            return reply({
                id: entrynumber,
                text: request.payload.text,
                facilitator: request.params.userId,
                createdAt: Date.now(),
                student: request.params.userId,
            });
        });
    }
    getUserNotes(request, reply) {
        _1.default.select().from('notes').where('student', '=', request.params.userId).then(function (rows) {
            reply({ "data": rows });
        });
    }
    deleteUserNoteById(request, reply) {
        _1.default('notes').where("id", request.params.noteId).del().then(function (rows, count) {
            console.log(count);
        });
        reply({
            id: request.params.noteId,
            student: request.params.userId,
            facilitator: request.params.userId,
            createdAt: Date.now(),
            text: "Whats the use of displaying delted note"
        });
    }
}
exports.default = UserController;
//# sourceMappingURL=user-controller.js.map