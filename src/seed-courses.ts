declare var require: any;
declare var module: any;

import * as colors from "colors";
import * as fs from "fs-extra";
import * as marked from "marked";
import * as Joi from "joi";
import database from './index';
import * as GoogleCloudStorage from "@google-cloud/storage";
import * as process from 'process'

/**
 ********************
 ** Updation Logic **
 ********************
 * 
 * 1. When there is a same file and the submission format has changed the related files will be deleted and re-created.
 * 2. When a file has been deleted, then delete it from the DB.
 * 3. When the submission format has not changed, then we can only update the content and be good with it.
 * 4. Change the order according to the new order.
 * 
 */

console.log( colors.blue.bold("------- CONTENT SEEDING SCRIPT STARTS -------") );
console.log( colors.green("Ensure that you are running this script from the `root` directory of `galileo`") );

// Helper method to throw an error with the given text and exit the script
let showErrorAndExit = function(message:string) {
    console.log( colors.red.bold(message) );
    console.log( colors.red("Fix the above error and re-run this script.") );
    process.exit();
};

// Globals
let courseDir, // Path of the course directory relative to this file
    courseData = {}, // Course data which will be put into the DB eventually
    exercises = [], // All exercises 
    allSlugs = [], // All slugs will be stored here
    courseId;

// Joi Schemas
let courseInfoSchema = Joi.object({
    name: Joi.string().required(),
    type: Joi.string().allow('html', 'js', 'python').required(),
    daysToComplete: Joi.number().required().strict(false),
    shortDescription: Joi.string().required(),
    logo: Joi.string(),
});

let exerciseInfoSchema =  Joi.object({
    name: Joi.string().required(),
    completionMethod: Joi.string().allow('manual', 'peer', 'facilitator', 'automatic')
});

// Helper function to generate UIDs
function generateUID() {
    // I generate the UID from two parts here 
    // to ensure the random number provide enough bits.
    let firstPart = ((Math.random() * 46656) | 0).toString(36);
    let secondPart = ((Math.random() * 46656) | 0).toString(36);
    firstPart = ("000" + firstPart).slice(-3);
    secondPart = ("000" + secondPart).slice(-3);
    return firstPart + secondPart;
}


// Given the markdown of an image this returns the path of the image on Google Cloud Storage
function parseAndUploadImage(imageText: string, sequenceNum: string, path: string) {
    
    // get relative image path and image name
    let temp1 = imageText.split(']')[1];
    let imagePath = temp1.slice(1, -1);
    let temp3 = imagePath.split('/');
    let imageName = temp3[temp3.length - 1];

    // remove exercise name from path
    let temp2 = path.split('/');
    temp2.pop();

    // use relative path and path in temp2 get the complete path relative to seed-courses.ts
    let semiPath = temp2.join('/');
    let completePath = semiPath + '/' + imagePath;

    var AWS = require('aws-sdk');
    var s3 = new AWS.S3();
    var myBucket = 'saralng';
    
    let localReadStream = fs.createReadStream(completePath);
    let dir = courseData['info']['name' ] + '/' + sequenceNum;
    let name = generateUID() + '.' + imageName;
    let filePath = dir + '/' + name;
    filePath = filePath.replace(/ /g, "__");
    
    return new Promise((resolve, reject) => {
        fs.readFile(completePath, function (err,data) {
            if (err) {
               return console.log(err);
            }
            console.log(completePath);

let extn = completePath.split('.').pop();
let contentType = 'application/octet-stream';
if (extn == 'html') contentType = "text/html";
if (extn == 'css') contentType = "text/css";
if (extn == 'js') contentType = "application/javascript";
if (extn == 'png' || extn == 'jpg' || extn == 'gif') contentType = "image/" + extn;

        	var params = {Bucket: myBucket, Key: filePath, Body: data, ContentType: contentType};
        	s3.upload(params, function(err, data) {
                if (err) {
                    console.log("error in s3 upload", err);
                    // return new Promise((resolve, reject) => {
                    //     resolve({
                    //         relativePath: "",
                    //         gcsL
                    //     });
                    // });    
                } else {

                        return resolve({
                                relativePath: imagePath,
                                gcsLink: "https://s3.ap-south-1.amazonaws.com/saralng/" + filePath,
                                imageMD: imageText,
                            });

                }
            });
        });

    });

 
    /*

    // initialise gcs
    let gcs = GoogleCloudStorage({
        projectId: 'navgurukul-159107',
        keyFilename: __dirname + '/' + 'configurations/ng-gcloud-key.json'
    });

    // upload image
    let bucket = gcs.bucket('ng-curriculum-images');
    let localReadStream = fs.createReadStream(completePath);
    let dir = courseData['info']['name' ] + '/' + sequenceNum;
    let name = generateUID() + '.' + imageName;
    let filePath = dir + '/' + name;
    filePath = filePath.replace(/ /g, "__");
    return new Promise((resolve, reject) => {
        let remoteWriteStream = bucket.file(filePath).createWriteStream();
        let stream =    localReadStream.pipe(remoteWriteStream);

        stream.on('finish', () => {
            return resolve({
                relativePath: imagePath,
                gcsLink: "https://storage.googleapis.com/ng-curriculum-images/" + filePath,
                imageMD: imageText,
            });
        });
    });

    */
}

// Get the nested list of all the exercises
let getCurriculumExerciseFiles = function(dir: string, callType?: string){
    
    let files = [];
    let exercises = [];
    // let exercises = [];
    files = fs.readdirSync(dir);
    let i = 0;
    let next = function() {
        let file = files[i++];
        if (!file) {
            return;
        }
        // If the file name does not start with the pattern 'number-' where number is a string or integer skip it
        let regExMatch = file.match(/^[0-9]+([.][0-9]+)?-/g);
        if (!regExMatch || regExMatch.length < 1) {
            next();
            return;
        }
        let sequenceNum = regExMatch[0].split('-')[0];
        file = dir + '/' + file;

        try {
            let fileStat = fs.statSync(file);
            if (fileStat && fileStat.isDirectory()) {
                exercises.push({
                    type: 'exercise',
                    path: file,
                    sequenceNum: Number(sequenceNum),
                    childExercises: []
                });
                let childResults = getCurriculumExerciseFiles(file, "recursive");
                let parentExercise = childResults.splice(0, 1)[0];
                exercises[exercises.length-1]['path'] = parentExercise.path;
                exercises[exercises.length-1]['childExercises'] = childResults;
                next();
                return;
            } else {
                // Check if the file name ends with '.md'
                if (!file.endsWith('.md')) {
                    next();
                    return;
                }
                // Push the exercise in the list of exercises
                exercises.push({
                    type: 'exercise',
                    path: file,
                    sequenceNum: Number(sequenceNum),
                    childExercises: []
                });
                next();
            }
            next();
        } catch (err) {
            console.log(err);
        }
    };
    next();
    exercises.sort(function(a, b) {
        return parseFloat(a.sequenceNum) - parseFloat(b.sequenceNum);
    });
    return exercises;
};

// Given a sequence number this method will return the next logical sequence number.
// This doesn't need to be the real order, but the next logical sequence number.
// Eg. if 1.2 is given this will give 1.3.
//     if 1 is given this will give 2
let _nextSeqNum = function (sequenceNum) {
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
let validateSequenceNumber = function(exercises, depthLevel?) {
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
                showErrorAndExit("Child exercises of Sequence Number " + exercises[i].sequenceNum + " are not in the sequential order.");
            }
        }
    }
    return true;
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
let parseNgMetaText = function(text: string) {
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

// Validate the course directory given in the parameters
let validateCourseDirParam = function() {

    // Parse the process to look for `courseDir`
    for (let i = 0; i < process.argv.length; i++){
        if (process.argv[i] === '--courseDir') {
            courseDir = process.argv[i+1];
        }
    }
    if (courseDir === undefined) {
        showErrorAndExit("Course directory is not specified using the --courseDir parameter");
    }
    courseDir = 'curriculum/' + courseDir;

    // Check if `courseDir` is actually a directory
    return fs.stat(courseDir).then( (stat) => {
        return Promise.resolve();
    })
    .catch( (err) => {
        showErrorAndExit("Course directory you have specified does not exist.");
    });

};


// Validate and return notes.md contents
// let validateCourseNotes = function() {
    // let courseNotesFile = courseDir + '/details/notes.md';
    // return fs.readFile(courseNotesFile, 'utf-8').then( (data) => {
    //     return Promise.resolve(data);
    // }).catch( (err) => {
    //     console.log(err);
    //     showErrorAndExit("`details/notes.md` does not exist.");
    // });
// };

// Validate and return the course info
let validateCourseInfo = function() {
    let courseInfoFile = courseDir + '/details/info.md';
    return fs.readFile(courseInfoFile, 'utf-8').then( (data) => {
        let tokens = marked.lexer(data);
        let ngMetaBlock = tokens[0];
        let courseInfo = parseNgMetaText(tokens[0]['text']);
        courseInfo = Joi.attempt(courseInfo, courseInfoSchema);
        courseData['info'] = courseInfo;
        return Promise.resolve();
    }).catch( (err) => {
        showErrorAndExit("`details/info.md` has some problem. Check the above error to understand it better.");
    });
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
    exInfo['slug'] = path.replace(courseDir + '/', '').replace('.md', '');
    exInfo['sequenceNum'] = sequenceNum;
    exInfo['path'] = path;
    exInfo['content'] = data;
    return exInfo;
};

let getAllExercises = function(exercises) {
    let exerciseInfos = [];
    for (let i = 0; i < exercises.length; i++) {
        let info = _getExerciseInfo(exercises[i].path, exercises[i].sequenceNum);
        if (exercises[i].childExercises.length > 0) {
            let childExercisesInfo = getAllExercises(exercises[i].childExercises);
            info['childExercises'] = childExercisesInfo;
        }
        exerciseInfos.push(info);
        allSlugs.push(info['slug']);
    }
    return exerciseInfos;
};

let _generateExerciseAddOrUpdateQuery = function(exerciseInfo) {
    let query = database('exercises')
    .select('id', 'reviewType')
    .where({ 'slug': exerciseInfo['slug'] })
    .then( (rows) => {
        // a exercise with same slug exists
        if (rows.length > 0) {
            let dbReviewType = rows[0].reviewType;
            return database('exercises')
            .where({ 'id': rows[0].id })
            .update(exerciseInfo)
            .then( () => {
                return Promise.resolve(rows[0].id);
            })
            .then( (exerciseId) => {
                // if the review type has changed then we will need to delete the submissions too
                if(dbReviewType !== exerciseInfo['reviewType']) {
                    return database('submissions')
                        .where({'exerciseId': rows[0].id})
                        .delete()
                        .then( () => {
                            return Promise.resolve(exerciseId);
                        });
                } else {
                    return Promise.resolve(exerciseId);
                }
            });
        }
        // an exercise with the same slug does not exist 
        else {
            return database('exercises')
            .insert(exerciseInfo)
            .then( (rows) => {
                return Promise.resolve(rows[0]);
            });
        }
    });
    return query;
};

let addOrUpdateExercises = function(exercises, courseId, promiseObj?) {
    let exInsertQs = [];
    for (let i = 0; i < exercises.length; i++) {
        let exerciseObj = {
            courseId: courseId,
            name: exercises[i]['name'],
            slug: exercises[i]['slug'],
            sequenceNum: exercises[i]['sequenceNum'],
            reviewType: exercises[i]['completionMethod'],
            content: exercises[i]['content']
        };

        let query;
        if (!promiseObj) {
            query = _generateExerciseAddOrUpdateQuery(exerciseObj);            
        } else {
            promiseObj.then( (exerciseId) => {
                exerciseObj['parentExerciseId'] = exerciseId;
                query = _generateExerciseAddOrUpdateQuery(exerciseObj);
                return query;
            });
        }

        if (exercises[i].childExercises && exercises[i].childExercises.length > 0){
            addOrUpdateExercises(exercises[i].childExercises, courseId, query);
        }

        exInsertQs.push(query);
        
    }
    return exInsertQs;
};

let addOrUpdateCourse = function() {
    return database('courses')
    .select('*')
    .where({ 'name': courseData['info']['name'] })
    .then( (rows) => {
        if (rows.length > 0) {
            return Promise.resolve(rows[0].id);
        } else {
            return Promise.resolve(null);
        }
    }).then( (courseId) => {
        if (courseId == null) {
            return database('courses')
            .insert({
                'type': courseData['info']['type'],
                'name': courseData['info']['name'],
                'logo': courseData['info']['logo'],
                'shortDescription': courseData['info']['shortDescription'],
                'daysToComplete': courseData['info']['daysToComplete'],
                // 'notes': courseData['notes'],
            })
            .then( (rows) => {
                return Promise.resolve(rows[0]);
            });
        } else {
            return database('courses')
            .update({ // Not updating `type` and `name` as assuming they won't change
                'logo': courseData['info']['logo'],
                'shortDescription': courseData['info']['shortDescription'],
                'daysToComplete': courseData['info']['daysToComplete'],
                // 'notes': courseData['notes'],
            })
            .then( () => {
                return Promise.resolve(courseId);
            });
        }
    });
};

let deleteExercises = function(courseId) {
    database('exercises')
    .select('slug')
    .where({ 'courseId': courseId })
    .then( (rows) => {
        let slugs = [];
        for (let i=0; i<rows.length; i++) {
            slugs.push(rows[i]['slug']);
        }
        return Promise.resolve(slugs);
    })
    .then( (dbSlugs) => {
        // get the slugs which exist in the DB but not in the slug list we have
        // those ones need to be deleted
        let slugDiff = dbSlugs.filter(function(x) { return allSlugs.indexOf(x) < 0; });
        // delete the exercises with the slugs where the slugs are in slug diff
        let deleteQueries = [];
        for (let i=0; i<slugDiff.length; i++) {
            deleteQueries.push(
                database('exercises')
                .select('id')
                .where({'slug': slugDiff[i]})
                .then( (rows) => {
                    let exId = rows[0].id;
                    return database('submissions')
                    .where({'exerciseId': exId})
                    .delete()
                    .then( () => {
                        console.log("Did it come here?");
                        return database('exercises')
                        .where({'slug': slugDiff[i]})
                        .delete();
                    });
                })
            );
        }
        return Promise.all(deleteQueries).then( () => {
            return Promise.resolve(true);
        });
    });
};

// Updates the content with the links of images which have been uploaded to the Google Cloud    
function updateContentWithImageLinks(images: any[], content: string): string {
    let updateContent = content;

    images.forEach(image => {
        // TODO need o be updated from gcloud tto amazon
        updateContent = updateContent.replace(image.relativePath, image.gcsLink);
    });

    return updateContent;
}

// Check if the --courseDir parameter is correct
validateCourseDirParam()
.then( () => {
    // Check if the details/notes.md file is correct
    // return validateCourseNotes();
// }).then( (courseNotes) => {
    // Add the notes in the courseData object which will be used to add the course
    // courseData['notes'] = courseNotes;
    // return Promise.resolve();
// }).then( () => {
    // Check if the details/info.md file is correct 
    return validateCourseInfo();
}).then( () => {
    // Get a list of files and validate their sequence numbers
    exercises = getCurriculumExerciseFiles(courseDir);
    validateSequenceNumber(exercises);
    // Get the exercise content from the files
    exercises = getAllExercises(exercises);
    return Promise.resolve(exercises);
}).then( () => {

    //TODO: This is a hackish solution to get shit done. Needs to be re-factored later on.
    //Rishabh is responsible for this mess.

    // Upload the images to GCS before updating/adding stuff to the DBss
    let exPromises = [];
    let exChildPromises = [];
    for (let i = 0; i < exercises.length; i++) {
        let uploadPromises = [];
        let exInfo = exercises[i];
        let images = exInfo['content'].match(/!\[(.*?)\]\((.*?)\)/g);
        if (images!=null) {
            for (let j = 0; j < images.length; j++) {
                uploadPromises.push( parseAndUploadImage(images[j], exInfo['sequenceNum'], exInfo['path']) );
            }
        }

        exPromises.push( Promise.all(uploadPromises).then( (uploadedImages) => {
            exercises[i]['content'] = updateContentWithImageLinks(uploadedImages, exercises[i]['content']);
        }) );
        
        if (exInfo['childExercises'] != null) {
            let uploadChildPromises = [];
            for (let j = 0; j < exInfo['childExercises'].length; j++) {
                let exInfoChild = exInfo['childExercises'][j];
                let images = exInfoChild['content'].match(/!\[(.*?)\]\((.*?)\)/g);
                if (images!=null) {
                    for (let h = 0; h < images.length; h++) {
                        let img = parseAndUploadImage(images[h], exInfo['sequenceNum'] + '/' + exInfoChild['sequenceNum'], exInfo['path']);
                        uploadChildPromises.push( img );
                    }
                    exChildPromises.push( Promise.all(uploadChildPromises).then( (uploadedImages) => {
                        let content = exercises[i]['childExercises'][j]['content'];
                        exercises[i]['childExercises'][j]['content'] = updateContentWithImageLinks(uploadedImages, content);
                    }) );
                }
            }
        }
    }

    return Promise.all(exPromises).then( () => {
        return Promise.all(exChildPromises).then( () => {
            return Promise.resolve();
        });
        // return Promise.resolve();
    });
}).then( () => {
    // Add or update the course
    return addOrUpdateCourse();
} ).then( (courseId) => {
    // delete any exercises if they exist in the DB and not in the curriculum
    deleteExercises(courseId);
    return Promise.resolve(courseId);
}).then( (courseId) => {
    // add or update the exercises in the DB
    let promises = addOrUpdateExercises(exercises, courseId);
    Promise.all(promises);
}).then( () => {
    // say your goodbyes :)
    console.log( colors.green("The requested course has been seeded/updated into the DB.") );    
    console.log( colors.blue.bold("------- CONTENT SEEDING SCRIPT ENDS -------") );
}).catch( (err) => {    
    // Throw an error in case of one.
    console.log(err);
});
