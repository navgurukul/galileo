
declare var require: any;
declare var module: any;

import * as fs from "fs-extra";
import * as marked from "marked";
import * as Joi from "joi";
// import * as colors from "colors";
import { showErrorAndExit } from "./utils";
import { exerciseInfoSchema } from './schema';
import { updateContentWithImageLinks } from './utils';
import { parseAndUploadImage } from './s3';


var globals = require('./globals');
let newtonGithubUrl = 'https://github.com/navgurukul/newton/tree/master/';

export const getSequenceNumbers = function(dir: string, callType?: string) {
    let fileName = "index.md";
    let data = fs.readFileSync(dir + "/index.md");
    let tokens = marked.lexer(data.toString());
    let seqNumbers = {};
    let l1 = 0;
    let l2 = 0;
    let inside = false;
    let insideInnerList = false;
    let isSolutionToken;
    
    for (let i=1; i<tokens.length-1; i++) {
        tokens[i]["text"] = tokens[i]["text"] ? tokens[i]["text"].trim() : undefined;
        if (tokens[i]["type"]==="list_start" && inside===true) {
            insideInnerList = true;
        } else if(tokens[i]["type"]==="list_end" && inside===true  && insideInnerList === true) {
            insideInnerList = false;
        } else if (tokens[i]["type"]==="list_start" && tokens[i-1]["text"]!=null && !(tokens[i-1]["text"].indexOf('.md')>-1)) { //the lsi
            inside=true;
            l2=0;
        } else if (tokens[i]["type"]==="list_start" && (tokens[i-1]["text"].indexOf('.md')>-1)) { //the lsi
            isSolutionToken=true;
            l2=0;
        }else if (tokens[i]["type"]==="list_end" && isSolutionToken===true) { //the lsi
            isSolutionToken=false;
            l2=0;}
        else if (tokens[i]["type"]==="text") {
            if (insideInnerList) {
                seqNumbers[globals.revSeqNumbers[l1]["name"]+"/"+tokens[i]["text"]] = l1*1000+l2;
                globals.revSeqNumbers[l1]["children"][l2]={"name": tokens[i]["text"], 'isSolutionFile': true};
                l2++;
            } else if (inside) {
                if (l2===0) {
                    seqNumbers[globals.revSeqNumbers[l1]["name"]+"/"+tokens[i]["text"]] = l1*1000;
                    globals.revSeqNumbers[l1]["children"]={0: {"name": tokens[i]["text"], 'isSolutionFile': false}};
                } else {
                    seqNumbers[globals.revSeqNumbers[l1]["name"]+"/"+tokens[i]["text"]] = l1*1000+l2;
                    globals.revSeqNumbers[l1]["children"][l2]={"name": tokens[i]["text"], 'isSolutionFile': false};
                }
                l2++;
            }
            if (!inside) {
                if (isSolutionToken) {
                    l1++;
                    seqNumbers[tokens[i]["text"]] = l1*1000;
                    globals.revSeqNumbers[l1] = {"name" : tokens[i]["text"], 'isSolutionFile': true};
                } else {
                    l1++;
                    seqNumbers[tokens[i]["text"]] = l1*1000;
                    globals.revSeqNumbers[l1] = {"name" : tokens[i]["text"], 'isSolutionFile': false};
                }
                
            }
        } else if (tokens[i]["type"]==="list_end") {
            inside=false;
        }
    }
    // 
    return seqNumbers;
};

// Get the nested list of all the exercises
export const getCurriculumExerciseFiles = function(dir: string, callType?: string){
    let files = [];
    let exercises = [];
    let isSolutionFile ;
    for (const i of Object.keys(globals.revSeqNumbers)) {
        let mFile = globals.revSeqNumbers[i]["name"];
        let sequence_num = globals.sequence_numbers[mFile];
        mFile = dir + "/" + mFile;
        if (!globals.revSeqNumbers[i]["children"]) {
            isSolutionFile = globals.revSeqNumbers[i]["isSolutionFile"];
            exercises.push({
                type: 'exercise',
                path: mFile,
                sequence_num: Number(sequence_num),
                isSolutionFile: isSolutionFile,
                childExercises: []
            });
        } else {
            let childExercises = [];
            for (const j of Object.keys(globals.revSeqNumbers[i]["children"])) {
                let file = globals.revSeqNumbers[i]["children"][j]["name"];
                isSolutionFile = globals.revSeqNumbers[i]["children"][j]["isSolutionFile"];
                sequence_num = globals.sequence_numbers[globals.revSeqNumbers[i]["name"]+"/"+file];
                childExercises.push({
                    type: 'exercise',
                    path: mFile+"/"+file,
                    isSolutionFile: isSolutionFile,
                    sequence_num: Number(sequence_num),
                    childExercises: []
                });
            }
            exercises.push({
                type: 'exercise',
                path: mFile+"/"+ globals.revSeqNumbers[i]["children"][0]["name"],
                isSolutionFile: globals.revSeqNumbers[i]["children"][0]["isSolutionFile"],
                sequence_num: Number(sequence_num),
                childExercises: childExercises
            });
        }
    }
    exercises.sort(function(a, b) {
        return parseFloat(a.sequence_num) - parseFloat(b.sequence_num);
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
days_to_complete: 20
short_description: Build any web page under the sun after taking up this course :)
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
            // parsed = null;
            return;
        }
        let lineKey = tokens[0].trim();
        let lineValue = tokens.slice(1).join(':').trim();
        parsed[ lineKey ] = lineValue;
    });
    return parsed;
};

const _getFileName = (path) => {
    path = path.split('/');
    let fileName = path[path.length-1];
    let wordInFileName =  fileName.replace('.md', '').replace(/[-__/_]/g, ' ').split(' ');
    let newFileName = "", temp;

    // change the first letter of each word to upper case
    for(let i = 0; i < wordInFileName.length; i++){
        temp = wordInFileName[i];
        temp = temp[0].toUpperCase() + temp.slice(1, temp.length);

        // don't add spaces if it is the last word
        if (i === wordInFileName.length-1){
            newFileName += temp;
        } else {
            newFileName += `${temp} `;
        }
    };

    return newFileName;
};

// Validate and return the content and meta information of an exercise on the given path
let _getExerciseInfo = function(path, sequence_num, isSolutionFile) {
    let exInfo = {};
    let data = fs.readFileSync(path, 'utf-8');
    let tokens = marked.lexer(data);
    let gitFile = path.replace('curriculum/', '');
    if (tokens.length < 1) {
        showErrorAndExit("No proper markdown content found in " + path);
    }
    let fileName = _getFileName(path);

    if (tokens[0].type !== 'code' || tokens[0].lang !== 'ngMeta') {
        exInfo['name'] = fileName;
        exInfo['completionMethod'] = 'manual';
    }
    else{
        exInfo  = parseNgMetaText(tokens[0]['text']);
        try {
            if (exInfo['name'] === null || exInfo['name'] === undefined){
                exInfo['name'] = fileName;
            }
        } catch {
            showErrorAndExit(`There is some error in ${path}`);
        }

        if (!exInfo['completionMethod']){
            exInfo['completionMethod'] = 'peer';
        }
    }
    exInfo  = Joi.attempt(exInfo, exerciseInfoSchema);
    exInfo['slug'] = path.replace('curriculum/','').replace('/', '__').replace('.md', '');
    exInfo['sequence_num'] = sequence_num;
    exInfo['path'] = path;
    exInfo['isSolutionFile'] = isSolutionFile;
    exInfo['content'] = data;
    exInfo['github_link'] = newtonGithubUrl + gitFile;
    return exInfo;
};


export const getAllExercises = function(exercises) {
    let exerciseInfos = [];
    for (let i = 0; i < exercises.length; i++) {
        let info = _getExerciseInfo(exercises[i].path, exercises[i].sequence_num, exercises[i].isSolutionFile);
        if (exercises[i].childExercises.length > 0) {
            let childExercisesInfo = getAllExercises(exercises[i].childExercises);
            info['childExercises'] = childExercisesInfo;
        }
        exerciseInfos.push(info);
        globals.allSlugs.push(info['slug']);
    }
    return exerciseInfos;
};

let _uploadContentImages = (exercise, iIndex, parentSequenceNum?, jIndex?) => {
    let uploadPromises = [];
    let images = exercise['content'].match(/!\[(.*?)\]\((.*?)\)/g);
    if (images!=null) {
        for (let j = 0; j < images.length; j++) {
        let sequence_num;
        if (parentSequenceNum){
            sequence_num = parentSequenceNum + '/' + exercise['sequence_num'];
        }
        else{
            sequence_num = exercise['sequence_num'];
        }
        let img =  parseAndUploadImage(images[j], sequence_num, exercise['path'], iIndex, jIndex);

        uploadPromises.push( img );
        }
    }
    return Promise.all(uploadPromises);
};


export const uploadImagesAndUpdateContent = () => {
    let exPromises = [];
    let exChildPromises = [];
    for (var i = 0; i < globals.exercises.length; i++){
        let exercise = globals.exercises[i];
        exPromises.push( _uploadContentImages(exercise, i).then( ( uploadedImages ) => {
        if(uploadedImages.length){

            let iIndex, content;
            iIndex = uploadedImages[0].iIndex;
            content = exercise['content'];
            globals.exercises[iIndex]['content'] = updateContentWithImageLinks(uploadedImages, content);
        };
        }));
        let childExercises = exercise['childExercises'];
        if (childExercises){
        for (var j = 0; j < childExercises.length; j++){

            exChildPromises.push( _uploadContentImages(childExercises[j], i, exercise['sequence_num'], j).then( ( uploadedImages ) => {
            if(uploadedImages.length){
                let iIndex, jIndex, content;
                iIndex = uploadedImages[0].iIndex;
                jIndex = uploadedImages[0].jIndex;
                content = childExercises[jIndex]['content'];
                globals.exercises[iIndex]['childExercises'][jIndex]['content'] = updateContentWithImageLinks(uploadedImages, content);
            };
            }));
        };
        };
    };
    return {
        exPromises,
        exChildPromises
    };
};
