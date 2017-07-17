import * as colors from "colors";
import * as fs from "fs-extra";
import * as marked from "marked";
import * as Joi from "joi";
import database from './index';
import * as GoogleCloudStorage from "@google-cloud/storage";

/**
 * 1. Get the course name as an argument.
 * 2. Look for the directory of the given course name or throw an error.
 * 3. Look for the ngmeta tag in the course_name/info.md file and validate it for the following:
 *      a. name is present
 *      b. type is `html`, `css`, `python`
 *      c. daysToComplete is a number
 *      d. shortDescription is a string.
 * 4. The directory structure of the exercises will look something like this:
 *      html/
 *          details/
 *              info.md
 *              notes.md
 *          1-what-is-python.md
 *          2-syntax-intro/
 *              2-syntax-intro.md
 *              2.1-variable-names.md
 *              2.2-if-else.md
 *              2.3-something-else.md
 *          3-bockly-intro.md
 *          4-if-else-statements.md
 *          5-booleans.md
 *          6-loops/
 *              6-loops.md
 *              6.1-loopy-ti-loop.md
 *              6.2-loopology.md 
 *      javascript/
 *      python/
 *      english/
 *      flask_backend/
 * 4. Check if a html/details/notes.md exists and just add the notes directly from there into the course or throw and error.
 * 5. Check if a html/details/info.md exists and add the info into the course object or throw an error.`
 * 6. Get a list of all files and strip of the numbers and check if they are sequential integers or throw an error.
 *    Do this for nested stuff too.
 * 7. Validate every exercise *.md file for the following things in `ngMeta` or throw an error:
 *      a. `name` should be there.
 *      b. `completionMethod` should be there and will be something out of 'manual','peer','facilitator','automatic'
 * 8. Remove the ```ngMeta``` from string and generate a list of objects.
 * 9. First add the course details and then add the details of every exercise.
 */

console.log(colors.green.bold("------- CONTENT SEEDING SCRIPT STARTS -------"));
console.log(colors.green("Ensure that you are running this script from the `root` directory of `galileo`"));

// Helper method to throw an error with the given text and exit the script
let showErrorAndExit = function (message: string) {
    console.log(colors.red.bold(message));
    console.log(colors.red("Fix the above error and re-run this script."));
    process.exit();
};

// Globals
let courseDir, // Path of the course directory relative to this file
    courseData = {}, // Course data which will be put into the DB eventually
    exercises = [], // All exercises 
    courseId;

// Joi Schemas
let courseInfoSchema = Joi.object({
    name: Joi.string().required(),
    type: Joi.string().allow('html', 'js', 'python').required(),
    daysToComplete: Joi.number().required().strict(false),
    shortDescription: Joi.string().required(),
    logo: Joi.string(),
});

let exerciseInfoSchema = Joi.object({
    name: Joi.string().required(),
    completionMethod: Joi.string().allow('manual', 'peer', 'facilitator', 'automatic')
});

// Get the nested list of all the exercises
let getCurriculumExerciseFiles = function (dir: string, callType?: string) {

    let files = [];
    let exercises = [];
    // let exercises = [];
    files = fs.readdirSync(dir);
    let i = 0;
    let next = function () {
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
                exercises[exercises.length - 1]['path'] = parentExercise.path;
                exercises[exercises.length - 1]['childExercises'] = childResults;
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
    exercises.sort(function (a, b) {
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
    } else {
        let numToSum = Number(Array(tokens[0].length).join('0') + '1');
        return Number(num) + numToSum;
    }
};

// Validate if sequence numbers are in a proper sequence.
// If they are not this will automatically end the script and show the error.
let validateSequenceNumber = function (exercises, depthLevel?) {
    if (!depthLevel) {
        depthLevel = 0;
    }
    let i = 0;
    for (let i = 0; i < exercises.length; i++) {
        if (!exercises[i + 1]) {
            continue;
        }
        if (exercises[i + 1].sequenceNum !== _nextSeqNum(exercises[i].sequenceNum)) {
            let msg = exercises[i].sequenceNum + " and " + _nextSeqNum(exercises[i].sequenceNum) +
                " don't have sequential sequence numbers.";
            showErrorAndExit(msg);
        }
        if (exercises[i].childExercises.length > 0) {
            let childExsValidated = validateSequenceNumber(exercises[i], depthLevel + 1);
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
let parseNgMetaText = function (text: string) {
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
        parsed[lineKey] = lineValue;
    });
    return parsed;
};

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

    // initialise gcs
    let gcs = GoogleCloudStorage({
        projectId: 'navgurukul-159107',
        keyFilename: __dirname + '/' + 'configurations/ng-gcloud-key.json'
    });

    // upload image
    let bucket = gcs.bucket('ng-curriculum-images');
    let localReadStream = fs.createReadStream(completePath);
    let dir = '/' + courseData['info']['name'] + '/' + sequenceNum;
    let name = generateUID() + '.' + imageName;
    let filePath = dir + '/' + name;
    return new Promise((resolve, reject) => {
        let remoteWriteStream = bucket.file(filePath).createWriteStream();
        let stream = localReadStream.pipe(remoteWriteStream);

        stream.on('finish', () => {
            resolve({
                relativePath: imagePath,
                gcsLink: "https://storage.googleapis.com/ng-curriculum-images" + filePath
            });
        });
    });
}

function updateContent(images: any[], content: string): string {
    let updateContent = content;
    images.forEach(image => {
        updateContent = updateContent.replace(image.relativePath, image.gcsLink);
    });
    return updateContent;
}

// Validate the course directory given in the parameters
let validateCourseDirParam = function () {

    // Parse the process to look for `courseDir`
    for (let i = 0; i < process.argv.length; i++) {
        if (process.argv[i] === '--courseDir') {
            courseDir = process.argv[i + 1];
        }
    }
    if (courseDir === undefined) {
        showErrorAndExit("Course directory is not specified using the --courseDir parameter");
    }
    courseDir = 'curriculum/' + courseDir;

    // Check if `courseDir` is actually a directory
    return fs.stat(courseDir).then((stat) => {
        return Promise.resolve();
    })
        .catch((err) => {
            showErrorAndExit("Course directory you have specified does not exist.");
        });

};


// Validate and return notes.md contents
let validateCourseNotes = function () {
    let courseNotesFile = courseDir + '/details/notes.md';
    return fs.readFile(courseNotesFile, 'utf-8').then((data) => {
        return Promise.resolve(data);
    }).catch((err) => {
        console.log(err);
        showErrorAndExit("`details/notes.md` does not exist.");
    });
};

// Validate and return the course info
let validateCourseInfo = function () {
    let courseInfoFile = courseDir + '/details/info.md';
    return fs.readFile(courseInfoFile, 'utf-8').then((data) => {
        let tokens = marked.lexer(data);
        let ngMetaBlock = tokens[0];
        let courseInfo = parseNgMetaText(tokens[0]['text']);
        courseInfo = Joi.attempt(courseInfo, courseInfoSchema);
        courseData['info'] = courseInfo;
        return Promise.resolve();
    }).catch((err) => {
        showErrorAndExit("`details/info.md` has some problem. Check the above error to understand it better.");
    });
};

// Validate and return the content and meta information of an exercise on the given path
let _getExerciseInfo = function (path, sequenceNum) {
    let exInfo = {};
    let data = fs.readFileSync(path, 'utf-8');
    let tokens = marked.lexer(data);
    if (tokens.length < 1) {
        showErrorAndExit("No proper markdown content found in " + path);
    }
    if (tokens[0].type !== 'code' || tokens[0].lang !== 'ngMeta') {
        showErrorAndExit("No code block of type `ngMeta` exists at the top of the exercise file " + path);
    }
    exInfo = parseNgMetaText(tokens[0]['text']);

    // array to store image data
    let images = [];

    let promises = [];
    new Promise((resolve, rejet) => {
        tokens.forEach(token => {
            if (token.type === 'paragraph') {
                let tokenWithouSpaces = (token.text.replace(/ /g, ''));
                if (tokenWithouSpaces.match(/!\[(.*?)\]\((.*?)\)/)) {
                    let uploadPromise = parseAndUploadImage(tokenWithouSpaces.match(/!\[(.*?)\]\((.*?)\)/)[0], sequenceNum, path);
                    promises.push(uploadPromise
                        .then((res) => {
                            images.push(res);
                            resolve();
                        }));
                }
            }
        });
    });
    return new Promise((resolve, reject) => {
        // after all the images have finished uploading
        Promise.all(promises).then(() => {
            exInfo = Joi.attempt(exInfo, exerciseInfoSchema);
            exInfo['slug'] = path.replace(courseDir + '/', '').replace('.md', '');
            exInfo['content'] = updateContent(images, data);
            exInfo['sequenceNum'] = sequenceNum;
            // return new Promise((resolve, reject) => {
            resolve(exInfo);
            // });
        });
    });
};

let getAllExercises = function (exercises) {
    let exerciseInfos = [];
    let promises = [];
    for (let i = 0; i < exercises.length; i++) {
        let exercisePromise = _getExerciseInfo(exercises[i].path, exercises[i].sequenceNum);
        promises.push(exercisePromise
            .then((res) => {
                let info = res;
                if (exercises[i].childExercises.length > 0) {
                    getAllExercises(exercises[i].childExercises)
                        .then((res) => {
                            info['childExercises'] = res;
                            exerciseInfos.push(info);
                        });
                }
                exerciseInfos.push(info);
            })
        );
    }
    return new Promise((resolve, reject) => {
        Promise.all(promises).then(() => {
            resolve(exerciseInfos);
        });
    });
};

let addExercises = function (exercises, courseId, promiseObj?) {
    let exInsertQs = [];
    for (let i = 0; i < exercises.length; i++) {
        let courseInsertObj = {
            courseId: courseId,
            name: exercises[i]['name'],
            slug: exercises[i]['slug'],
            sequenceNum: exercises[i]['sequenceNum'],
            reviewType: exercises[i]['completionMethod'],
            content: exercises[i]['content']
        };
        let insertQ;
        if (!promiseObj) {
            insertQ = database('exercises').insert(courseInsertObj).then((rows) => {
                return Promise.resolve(rows[0]);
            });
        } else {
            promiseObj.then((exerciseId) => {
                courseInsertObj['parentExerciseId'] = exerciseId;
                return database('exercises').insert(courseInsertObj);
            });
        }

        if (exercises[i].childExercises && exercises[i].childExercises.length > 0) {
            addExercises(exercises[i].childExercises, courseId, insertQ);
        }

        exInsertQs.push(insertQ);

    }
    return exInsertQs;
};

let addCourseAndExercises = function () {
    database('courses')
        .insert({
            'type': courseData['info']['type'],
            'name': courseData['info']['name'],
            'logo': courseData['info']['logo'],
            'shortDescription': courseData['info']['shortDescription'],
            'daysToComplete': courseData['info']['daysToComplete'],
            'notes': courseData['notes'],
        }).then((rows) => {
            courseId = rows[0];
            return Promise.resolve(courseId);
        }).then((courseId) => {
            addExercises(exercises, courseId)
            // console.log(  );
            // Promise.all(exInsertQs).then( () => {
            //     console.log("Ho gaya");
            // }).catch( (err) => {
            //     console.log(err);
            // }); 
        });
};


validateCourseDirParam()
    .then(() => {
        return validateCourseNotes();
    }).then((courseNotes) => {
        courseData['notes'] = courseNotes;
        return Promise.resolve();
    }).then(() => {
        return validateCourseInfo();
    }).then(() => {
        exercises = getCurriculumExerciseFiles(courseDir);
        validateSequenceNumber(exercises);
        getAllExercises(exercises).then((res: any[]) => {
            exercises = res;
            console.log(colors.red("Finished uploading images to GCS and updated relatve path with link"));
            addCourseAndExercises();
        })
    }).catch((err) => {
        console.log(err);
    });