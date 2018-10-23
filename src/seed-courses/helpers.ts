
declare var require: any;
declare var module: any;

import * as fs from "fs-extra";
import * as marked from "marked";
import * as Joi from "joi";
import { showErrorAndExit } from "./utils";
import { exerciseInfoSchema } from './schema';

var globals = require('./globals');

export const getSequenceNumbers = function(dir: string, callType?: string) {
    let fileName = "index.md";
    let data = fs.readFileSync(dir + "/index.md");
    let tokens = marked.lexer(data.toString());
    let seqNumbers = {};
    let l1 = 0;
    let l2 = 0;
    let inside = false;

    for (let i=1; i<tokens.length-1; i++) {
        tokens[i]["text"] = tokens[i]["text"] ? tokens[i]["text"].trim() : undefined;

        if (tokens[i]["type"]==="list_start") {
            inside=true;
            l2=0;
        } else if (tokens[i]["type"]==="text") {
            if (inside) {
                if (l2===0) {
                    seqNumbers[globals.revSeqNumbers[l1]["name"]+"/"+tokens[i]["text"]] = l1*1000;
                    globals.revSeqNumbers[l1]["children"]={0: {"name": tokens[i]["text"]}};
                } else {
                    seqNumbers[globals.revSeqNumbers[l1]["name"]+"/"+tokens[i]["text"]] = l1*1000+l2;
                    globals.revSeqNumbers[l1]["children"][l2]={"name": tokens[i]["text"]};
                }
                l2++;
            }
            if (!inside) {
                l1++;
                seqNumbers[tokens[i]["text"]] = l1*1000;
                globals.revSeqNumbers[l1] = {"name" : tokens[i]["text"]};
            }
       } else if (tokens[i]["type"]==="list_end") {
            inside=false;
       }
    }

    return seqNumbers;
};


// Get the nested list of all the exercises
export const getCurriculumExerciseFiles = function(dir: string, callType?: string){
    let files = [];
    let exercises = [];
    // let exercises = [];
    for (const i of Object.keys(globals.revSeqNumbers)) {
        let mFile = globals.revSeqNumbers[i]["name"];
        let sequenceNum = globals.sequenceNumbers[mFile];
        mFile = dir + "/" + mFile;
        if (!globals.revSeqNumbers[i]["children"]) {
            exercises.push({
                type: 'exercise',
                path: mFile,
                sequenceNum: Number(sequenceNum),
                childExercises: []
            });
        } else {
            let childExercises = [];
            for (const j of Object.keys(globals.revSeqNumbers[i]["children"])) {
                let file = globals.revSeqNumbers[i]["children"][j]["name"];
                sequenceNum = globals.sequenceNumbers[globals.revSeqNumbers[i]["name"]+"/"+file];
                childExercises.push({
                    type: 'exercise',
                    path: mFile+"/"+file,
                    sequenceNum: Number(sequenceNum),
                    childExercises: []
                });
            }

            exercises.push({
                type: 'exercise',
                path: mFile+"/"+ globals.revSeqNumbers[i]["children"][0]["name"],
                sequenceNum: Number(sequenceNum),
                childExercises: childExercises
            });
        }
    }
    exercises.sort(function(a, b) {
        return parseFloat(a.sequenceNum) - parseFloat(b.sequenceNum);
    });

    return exercises;
};


// Method to parse a text block which is assumed to have ky value pairs like we decided in the ngMeta code block
// These ngMeta text blocks will be used to store some semantic meta information about a mark down curriculum.
// It will look something like this:
/*
```ngMeta
name: Become a HTML/CSS Ninja
type: html
daysToComplete: 20
shortDescription: Build any web page under the sun after taking up this course :)
```
*/
// This assumes that every line under the triple tilde (```) will be a valid key/value pair.
// If it is not, it returns null for the whole block.

export const parseNgMetaText = function(text: string) {
    let lines = text.split('\n');
    let parsed = {};
    lines.forEach(line => {
        // Don't proceed if parsed has been set to null. Means one of the earlier key/value pairs were not correct
        if (parsed === null) {
            return;
        }
        let tokens = line.split(':');
        if (tokens.length < 2) {
            parsed = null;
            parsed = null;
            return;
        }
        let lineKey = tokens[0].trim();
        let lineValue = tokens.slice(1).join(':').trim();
        parsed[ lineKey ] = lineValue;
    });
    return parsed;
};



// Validate and return the content and meta information of an exercise on the given path
let _getExerciseInfo = function(path, sequenceNum) {
    let exInfo = {};
    let data = fs.readFileSync(path, 'utf-8');
    let tokens = marked.lexer(data);
    if (tokens.length < 1) {
        showErrorAndExit("No proper markdown content found in " + path);
    }
    if (tokens[0].type !== 'code' || tokens[0].lang !== 'ngMeta') {
        showErrorAndExit("No code block of type `ngMeta` exists at the top of the exercise file " + path);
    }
    exInfo  = parseNgMetaText(tokens[0]['text']);
    exInfo  = Joi.attempt(exInfo, exerciseInfoSchema);
    exInfo['slug'] = path.replace('curriculum/','').replace('/', '__').replace('.md', '');
    exInfo['sequenceNum'] = sequenceNum;
    exInfo['path'] = path;
    exInfo['content'] = data;
    return exInfo;
};

export const getAllExercises = function(exercises) {
    let exerciseInfos = [];
    for (let i = 0; i < exercises.length; i++) {
        let info = _getExerciseInfo(exercises[i].path, exercises[i].sequenceNum);
        if (exercises[i].childExercises.length > 0) {
            let childExercisesInfo = getAllExercises(exercises[i].childExercises);
            info['childExercises'] = childExercisesInfo;
        }
        exerciseInfos.push(info);
        globals.allSlugs.push(info['slug']);
    }
    return exerciseInfos;
};
