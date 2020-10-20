"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCourseInfo = exports.validateCourseDirParam = void 0;
const utils_1 = require("./utils");
const fs = require("fs-extra");
const marked = require("marked");
const Joi = require("joi");
var globals = require('./globals');
const helpers_1 = require("./helpers");
const schema_1 = require("./schema");
// Validate the course directory given in the parameters
exports.validateCourseDirParam = function () {
    if (globals.courseDir === undefined) {
        utils_1.showErrorAndExit("Course directory is not specified using the --courseDir parameter");
    }
    globals.courseDir = 'curriculum/' + globals.courseDir;
    // Check if `courseDir` is actually a directory
    return fs.stat(globals.courseDir).then((stat) => {
        return Promise.resolve();
    })
        .catch((err) => {
        return utils_1.showErrorAndExit("Course directory you have specified does not exist.");
    });
};
// Validate and return the course info
exports.validateCourseInfo = function () {
    let courseInfoFile = globals.courseDir + '/info.md';
    return fs.readFile(courseInfoFile, 'utf-8').then((data) => {
        let tokens = marked.lexer(data);
        let ngMetaBlock = tokens[0];
        let courseInfo = helpers_1.parseNgMetaText(tokens[0]['text']);
        courseInfo['logo'] = courseInfo['logo'] ? courseInfo['logo'] : globals.defaultCourseLogo;
        courseInfo = Joi.attempt(courseInfo, schema_1.courseInfoSchema);
        globals.courseData['info'] = courseInfo;
        return Promise.resolve();
    }).catch((err) => {
        utils_1.showErrorAndExit("`info.md` has some problem. Check the above error to understand it better." + err);
    });
};
//# sourceMappingURL=validators.js.map