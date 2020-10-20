"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.p = void 0;
// import * as colors from "colors";
// import * as fs from "fs-extra";
// import * as marked from "marked";
// import * as Joi from "joi";
const index_1 = require("../index");
// import * as GoogleCloudStorage from "@google-cloud/storage";
const process = require("process");
const Configs = require("../configurations");
const program = require('commander');
program.option('-c, --courseDir <courseDir>', 'course directory');
program.parse(process.argv);
var globals = require("./globals");
const helpers_1 = require("./helpers");
// import { generateUID } from './utils';
const validators_1 = require("./validators");
const database_1 = require("./database");
// import { exerciseInfoSchema, courseInfoSchema } from './schema';
/********************
 ** Updation Logic **
 ********************
 *
 * 1. When there is a same file and the submission format has changed the related files will be deleted and re-created.
 * 2. When a file has been deleted, then delete it from the DB.
 * 3. When the submission format has not changed, then we can only update the content and be good with it.
 * 4. Change the order according to the new order.
 *
 */
const Sentry = Configs.getSentryConfig();
// 
// Check if the --courseDir parameter is correct
globals.courseDir = program.courseDir;
exports.p = validators_1.validateCourseDirParam()
    .then(() => {
    // Check if the info.md file is correct
    return validators_1.validateCourseInfo();
})
    .then(() => {
    // Get a list of files and validate their sequence numbers
    //all the code related to info.md goes here.
    globals.sequence_numbers = helpers_1.getSequenceNumbers(globals.courseDir);
    globals.exercises = helpers_1.getCurriculumExerciseFiles(globals.courseDir);
    // Get the exercise content from the files
    globals.exercises = helpers_1.getAllExercises(globals.exercises);
    return Promise.resolve(globals.exercises);
})
    .then(() => {
    //TODO: This is a hackish solution to get shit done. Needs to be re-factored later on.
    //Rishabh is responsible for this mess.
    const { exPromises, exChildPromises } = helpers_1.uploadImagesAndUpdateContent();
    return Promise.all(exPromises).then(() => {
        return Promise.all(exChildPromises).then(() => {
            return Promise.resolve();
        });
        // return Promise.resolve();
    });
})
    .then(() => {
    // Add or update the course
    return database_1.addOrUpdateCourse();
})
    .then(course_id => {
    // delete any exercises if they exist in the DB and not in the curriculum
    database_1.deleteExercises(course_id);
    return Promise.resolve(course_id);
})
    .then(course_id => {
    // 
    // add or update the exercises in the DB
    let promises = database_1.addOrUpdateExercises(globals.exercises, course_id);
    Promise.all(promises);
})
    .then(() => {
    // say your goodbyes :)
    // 
    // 
    setTimeout(function () {
        index_1.default.destroy();
        process.exit();
    }, 3000); // waiting for no obvious reason; otherwise code breaks
})
    .catch(err => {
    console.log(err);
    Sentry.captureException(err);
    setTimeout(process.exit, 4000);
});
exports.default = null;
//# sourceMappingURL=index.js.map