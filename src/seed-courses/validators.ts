
declare var require: any;
declare var module: any;

import { showErrorAndExit } from "./utils";

import * as colors from "colors";
import * as fs from "fs-extra";
import * as marked from "marked";
import * as Joi from "joi";
import * as process from 'process';

var globals = require('./globals');
import { parseNgMetaText } from './helpers';
import { courseInfoSchema } from './schema';

// Given a sequence number this method will return the next logical sequence number.
// This doesn't need to be the real order, but the next logical sequence number.
// Eg. if 1.2 is given this will give 1.3.
//     if 1 is given this will give 2

let _nextSeqNum = (sequenceNum) => {
    let num = String(sequenceNum);
    let tokens = num.split('.');
    if (tokens.length === 1) {
        return Number(num) + 1;
    } else  {
        let numToSum = Number(Array(tokens[0].length).join('0') + '1');
        return Number(num) + numToSum;
    }
};
// Validate if sequence numbers are in a proper sequence.
// If they are not this will automatically end the script and show the error.

export const validateSequenceNumber = function(exercises, depthLevel?) {
    if (!depthLevel) {
        depthLevel = 0;
    }
    let i = 0;
    for(let i = 0; i < exercises.length; i++) {
        if  (!exercises[i+1]) {
            continue;
        }
        if (exercises[i+1].sequenceNum !== _nextSeqNum(exercises[i].sequenceNum)) {
            let msg = exercises[i].sequenceNum + " and " + _nextSeqNum(exercises[i].sequenceNum) +
                " don't have sequential sequence numbers.";
            showErrorAndExit(msg);
        }
        if (exercises[i].childExercises.length > 0) {
            let childExsValidated = validateSequenceNumber(exercises[i], depthLevel+1);
            if (!childExsValidated) {
                showErrorAndExit("Child ecourseDirxercises of Sequence Number "
                      + exercises[i].sequenceNum + " are not in the sequential order.");
            }
        }
    }
    return true;
};



// Validate the course directory given in the parameters

export const validateCourseDirParam = function() {

    // Parse the process to look for `courseDir`
    for (let i = 0; i < process.argv.length; i++){
        if (process.argv[i] === '--courseDir') {
            globals.courseDir = process.argv[i+1];
        }
    }
    if (globals.courseDir === undefined) {
        showErrorAndExit("Course directory is not specified using the --courseDir parameter");
    }
    globals.courseDir = 'curriculum/' + globals.courseDir;

    // Check if `courseDir` is actually a directory
    return fs.stat(globals.courseDir).then( (stat) => {
        return Promise.resolve();
    })
    .catch( (err) => {
        showErrorAndExit("Course directory you have specified does not exist.");
    });

};


// Validate and return the course info

export const validateCourseInfo = function() {
    let courseInfoFile = globals.courseDir + '/details/info.md';
    return fs.readFile(courseInfoFile, 'utf-8').then( (data) => {
        let tokens = marked.lexer(data);
        let ngMetaBlock = tokens[0];
        let courseInfo = parseNgMetaText(tokens[0]['text']);
        courseInfo = Joi.attempt(courseInfo, courseInfoSchema);
        globals.courseData['info'] = courseInfo;
        return Promise.resolve();
    }).catch( (err) => {
        showErrorAndExit("`details/info.md` has some problem. Check the above error to understand it better.");
    });
};
