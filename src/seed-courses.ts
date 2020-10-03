declare var require: any;
declare var module: any;

import * as colors from "colors";
import * as fs from "fs-extra";
import * as marked from "marked";
import * as Joi from "joi";
import database from './index';
// import * as GoogleCloudStorage from "@google-cloud/storage";
import * as process from 'process';

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

//
//

// Helper method to throw an error with the given text and exit the script

let showErrorAndExit = function(message:string) {
    console.log( colors.red.bold(message) );
    // console.log( colors.red("Fix the above error and re-run this script.") );
    process.exit();
};

// Globals
let courseDir, // Path of the course directory relative to this file
    courseData = {}, // Course data which will be put into the DB eventually
    exercises = [], // All exercises
    allSlugs = [], // All slugs will be stored here
    sequence_numbers = {},
    revSeqNumbers = {},
    toReadFiles = [],
    course_id;

// Joi Schemas
let courseInfoSchema = Joi.object({
    name: Joi.string().required(),
    type: Joi.string().allow('html', 'js', 'python').required(),
    days_to_complete: Joi.number().required().strict(false),
    short_description: Joi.string().required(),
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
                                                                                                                                                                                                                                
function parseAndUploadImage(imageText: string, sequence_num: string,path: string) {

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
    let dir = courseData['info']['name' ] + '/' + sequence_num;
    let name = generateUID() + '.' + imageName;
    let filePath = dir + '/' + name;
    filePath = filePath.replace(/ /g, "__");

    return new Promise((resolve, reject) => {
        fs.readFile(completePath, function (err,data) {
          if (err) {
             return 
          }

          let extn = completePath.split('.').pop();
          let contentType = 'application/octet-stream';
          if (extn === 'html') {
              contentType = "text/html";
          } else if (extn === 'css') {
              contentType = "text/css";
          } else if (extn === 'js') {
              contentType = "application/javascript";
          } else if (extn === 'png' || extn === 'jpg' || extn === 'gif') {
              contentType = "image/" + extn;
          }

        	var params = {Bucket: myBucket, Key: filePath, Body: data, ContentType: contentType};
        	s3.upload(params, function(err, data) {
                if (err) {
                    
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
    let dir = courseData['info']['name' ] + '/' + sequence_num;
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

let getSequenceNumbers = function(dir: string, callType?: string) {
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
                    seqNumbers[revSeqNumbers[l1]["name"]+"/"+tokens[i]["text"]] = l1*1000;
                    revSeqNumbers[l1]["children"]={0: {"name": tokens[i]["text"]}};
                } else {
                    seqNumbers[revSeqNumbers[l1]["name"]+"/"+tokens[i]["text"]] = l1*1000+l2;
                    revSeqNumbers[l1]["children"][l2]={"name": tokens[i]["text"]};
                }
                l2++;
            }
            if (!inside) {
                l1++;
                seqNumbers[tokens[i]["text"]] = l1*1000;
                revSeqNumbers[l1] = {"name" : tokens[i]["text"]};
            }
       } else if (tokens[i]["type"]==="list_end") {
            inside=false;
       }
    }

    return seqNumbers;
};

// Get the nested list of all the exercises

let getCurriculumExerciseFiles = function(dir: string, callType?: string){
    let files = [];
    let exercises = [];
    // let exercises = [];
    for (const i of Object.keys(revSeqNumbers)) {
        let mFile = revSeqNumbers[i]["name"];
        let sequence_num = sequence_numbers[mFile];
        mFile = dir + "/" + mFile;
        if (!revSeqNumbers[i]["children"]) {
            exercises.push({
                type: 'exercise',
                path: mFile,
                sequence_num: Number(sequence_num),
                childExercises: []
            });
        } else {
            let childExercises = [];
            for (const j of Object.keys(revSeqNumbers[i]["children"])) {
                let file = revSeqNumbers[i]["children"][j]["name"];
                sequence_num = sequence_numbers[revSeqNumbers[i]["name"]+"/"+file];
                childExercises.push({
                    type: 'exercise',
                    path: mFile+"/"+file,
                    sequence_num: Number(sequence_num),
                    childExercises: []
                });
            }

            exercises.push({
                type: 'exercise',
                path: mFile+"/"+ revSeqNumbers[i]["children"][0]["name"],
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

// Given a sequence number this method will return the next logical sequence number.
// This doesn't need to be the real order, but the next logical sequence number.
// Eg. if 1.2 is given this will give 1.3.
//     if 1 is given this will give 2

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
        showErrorAndExit("Course directory is not specified using the --courseDir parameter, cheking");
    }
    courseDir = 'curriculum/' + courseDir;

    // Check if `courseDir` is actually a directory
    return fs.stat(courseDir).then( (stat) => {
        return Promise.resolve();
    })
    .catch( (err) => {
       return showErrorAndExit("Course directory you have specified does not exist.");
    });

};


// Validate and return notes.md contents
// let validateCourseNotes = function() {
    // let courseNotesFile = courseDir + '/details/notes.md';
    // return fs.readFile(courseNotesFile, 'utf-8').then( (data) => {
    //     return Promise.resolve(data);
    // }).catch( (err) => {
    //     
    //     showErrorAndExit("`details/notes.md` does not exist.");
    // });
// };

// Validate and return the course info

let validateCourseInfo = function() {
    let courseInfoFile = courseDir + '/info.md';
    return fs.readFile(courseInfoFile, 'utf-8').then( (data) => {
        let tokens = marked.lexer(data);
        let ngMetaBlock = tokens[0];
        
        let courseInfo = parseNgMetaText(tokens[0]['text']);
        courseInfo = Joi.attempt(courseInfo, courseInfoSchema);
        courseData['info'] = courseInfo;
        return Promise.resolve();
    }).catch( (err) => {
        showErrorAndExit("`info.md` has some problem. Check the above error to understand it better.");
    });
};

// Validate and return the content and meta information of an exercise on the given path

let _getExerciseInfo = function(path, sequence_num) {
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
    exInfo['sequence_num'] = sequence_num;
    exInfo['path'] = path;
    exInfo['content'] = data;
    return exInfo;
};

let getAllExercises = function(exercises) {
    let exerciseInfos = [];
    for (let i = 0; i < exercises.length; i++) {
        let info = _getExerciseInfo(exercises[i].path, exercises[i].sequence_num);
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
    .where({ 'slug': exerciseInfo['slug'] })
    .then( (rows) => {
        // a exercise with same slug exists
        if (rows.length > 0) {
            let dbReviewType = rows[0].review_type;
            return database('exercises')
            .where({ 'id': rows[0].id })
            .update(exerciseInfo)
            .then( () => {
                return Promise.resolve(rows[0].id);
            })
            .then( (exercise_id) => {
                // if the review type has changed then we will need to delete the submissions too
                if(dbReviewType !== exerciseInfo['review_type']) {
                    return database('submissions')
                        .where({'exercise_id': rows[0].id})
                        .delete()
                        .then( () => {
                            return Promise.resolve(exercise_id);
                        });
                } else {
                    return Promise.resolve(exercise_id);
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

let addOrUpdateExercises = function(exercises, course_id, promiseObj?) {
    let exInsertQs = [];
    for (let i = 0; i < exercises.length; i++) {
        let exerciseObj = {
            course_id: course_id,
            name: exercises[i]['name'],
            slug: exercises[i]['slug'],
            sequence_num: exercises[i]['sequence_num'],
            review_type: exercises[i]['completionMethod'],
            content: exercises[i]['content']
        };

        let query;
        if (!promiseObj) {
            query = _generateExerciseAddOrUpdateQuery(exerciseObj);
        } else {
            promiseObj.then( (exercise_id) => {
                exerciseObj['parent_exercise_id'] = exercise_id;
                query = _generateExerciseAddOrUpdateQuery(exerciseObj);
                return query;
            });
        }

        if (exercises[i].childExercises && exercises[i].childExercises.length > 0){
            addOrUpdateExercises(exercises[i].childExercises, course_id, query);
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
    }).then( (course_id) => {
        if (course_id == null) {
            return database('courses')
            .insert({
                'type': courseData['info']['type'],
                'name': courseData['info']['name'],
                'logo': courseData['info']['logo'],
                'short_description': courseData['info']['short_description'],
                'days_to_complete': courseData['info']['days_to_complete'],
                // 'notes': courseData['notes'],
            })
            .then( (rows) => {
                return Promise.resolve(rows[0]);
            });
        } else {
            return database('courses')
            .where({ 'name': courseData['info']['name'] })
            .update({ // Not updating `type` and `name` as assuming they won't change
                'logo': courseData['info']['logo'],
                'short_description': courseData['info']['short_description'],
                'days_to_complete': courseData['info']['days_to_complete'],
            })
            .then( () => {
                return Promise.resolve(course_id);
            });
        }
    });
};

let deleteExercises = function(course_id) {
    database('exercises')
    .select('slug')
    .where({ 'course_id': course_id })
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
                    .where({'exercise_id': exId})
                    .delete()
                    .then( () => {
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
    // Check if the details/info.md file is correct
    return validateCourseInfo();
}).then( () => {
    // Get a list of files and validate their sequence numbers
    sequence_numbers = getSequenceNumbers(courseDir);
    exercises = getCurriculumExerciseFiles(courseDir);
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
                uploadPromises.push( parseAndUploadImage(images[j], exInfo['sequence_num'], exInfo['path']) );
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
                        let img = parseAndUploadImage(images[h], exInfo['sequence_num'] + '/' + exInfoChild['sequence_num'], exInfo['path']);
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
}).then(() => {
    // Add or update the course
    return addOrUpdateCourse();
} ).then((course_id) => {
    // delete any exercises if they exist in the DB and not in the curriculum
    deleteExercises(course_id);
    return Promise.resolve(course_id);
}).then((course_id) => {
    // add or update the exercises in the DB
    let promises = addOrUpdateExercises(exercises, course_id);
    Promise.all(promises);
}).then(() => {
    // say your goodbyes :)
    // 
    // 
    setTimeout(function() {
        database.destroy();
    	  process.exit();
    }, 3000); // waiting for no obvious reason; otherwise code breaks
}).catch((err) => {
    // Throw an error in case of one.
    console.log(err);
    process.exit();
});
