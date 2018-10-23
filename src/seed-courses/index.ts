declare var require: any;
declare var module: any;

import * as colors from "colors";
import * as fs from "fs-extra";
import * as marked from "marked";
import * as Joi from "joi";
import database from '../index';
// import * as GoogleCloudStorage from "@google-cloud/storage";
import * as process from 'process';

var globals = require('./globals');

import { getSequenceNumbers, getCurriculumExerciseFiles, getAllExercises, uploadImagesAndUpdateContent } from './helpers';
import { updateContentWithImageLinks, generateUID } from './utils';

import { validateSequenceNumber, validateCourseDirParam, validateCourseInfo } from './validators';
import { addOrUpdateExercises, addOrUpdateCourse, deleteExercises } from './database';
import { exerciseInfoSchema, courseInfoSchema } from './schema';


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


// Check if the --courseDir parameter is correct

validateCourseDirParam()
    .then( () => {
        // Check if the details/info.md file is correct
        return validateCourseInfo();
    }).then( () => {
        // Get a list of files and validate their sequence numbers
        globals.sequenceNumbers = getSequenceNumbers(globals.courseDir);
        globals.exercises = getCurriculumExerciseFiles(globals.courseDir);
        // validateSequenceNumber(globals.exercises);
        // Get the exercise content from the files
        globals.exercises = getAllExercises(globals.exercises);
        return Promise.resolve(globals.exercises);
    }).then( () => {

        //TODO: This is a hackish solution to get shit done. Needs to be re-factored later on.
        //Rishabh is responsible for this mess.

        const {exPromises, exChildPromises} = uploadImagesAndUpdateContent();

        return Promise.all(exPromises).then( () => {
            return Promise.all(exChildPromises).then( () => {
                return Promise.resolve();
            });
            // return Promise.resolve();
        });
    }).then(() => {
        // Add or update the course
        return addOrUpdateCourse();
    } ).then((courseId) => {
        // delete any exercises if they exist in the DB and not in the curriculum
        deleteExercises(courseId);
        return Promise.resolve(courseId);
    }).then((courseId) => {
        // add or update the exercises in the DB
        let promises = addOrUpdateExercises(globals.exercises, courseId);
        Promise.all(promises);
    }).then(() => {
        // say your goodbyes :)
        // console.log( colors.green("The requested course has been seeded/updated into the DB.") );
        // console.log( colors.blue.bold("------- CONTENT SEEDING SCRIPT ENDS -------") );
        setTimeout(function() {
            database.destroy();
        	  process.exit();
        }, 3000); // waiting for no obvious reason; otherwise code breaks
    }).catch((err) => {
        // Throw an error in case of one.
        console.log(err);
        process.exit();
    });

export default null;
