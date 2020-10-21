
declare var require: any;
declare var module: any;

import { showErrorAndExit } from "./utils";

import * as fs from "fs-extra";
import * as marked from "marked";
import * as Joi from "joi";
import * as process from 'process';


var globals = require('./globals');

import { parseNgMetaText } from './helpers';
import { courseInfoSchema } from './schema';


// Validate the course directory given in the parameters

export const validateCourseDirParam = function () {
    if (globals.courseDir === undefined) {
        showErrorAndExit("Course directory is not specified using the --courseDir parameter");
    }
    globals.courseDir = 'curriculum/' + globals.courseDir;

    // Check if `courseDir` is actually a directory
    return fs.stat(globals.courseDir).then((stat) => {
        return Promise.resolve();
    })
        .catch((err) => {
           return showErrorAndExit("Course directory you have specified does not exist.");
        });

};


// Validate and return the course info

export const validateCourseInfo = function () {
    let courseInfoFile = globals.courseDir + '/info.md';
    
    return fs.readFile(courseInfoFile, 'utf-8').then((data) => {
        let tokens = marked.lexer(data);
       
        
        let ngMetaBlock = tokens[0];
        let courseInfo = parseNgMetaText(tokens[0]['text']); 
        
        
        courseInfo['logo'] = courseInfo['logo'] ? courseInfo['logo'] : globals.defaultCourseLogo;

        courseInfo = Joi.attempt(courseInfo, courseInfoSchema);
        globals.courseData['info'] = courseInfo;
     
        return Promise.resolve();

    }).catch((err) => {
        showErrorAndExit("`info.md` has some problem. Check the above error to understand it better."+err);
    });
};
