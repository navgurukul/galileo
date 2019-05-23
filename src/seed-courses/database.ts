
import database from '../index';
var globals = require('./globals');

import * as Configs from "../configurations";
let serverConfigs = Configs.getServerConfigs();

import {
    sendCliqIntimation,
    sendCliqIntimationMessagetest
} from "../cliq";


let count = 1;

let upperCountthen = 1;

let sendAllUserMessage = function (exerciseDetails,functionName) {
    database('users')
        .select('users.email', 'users.name')
        .innerJoin(
            "user_roles",
            "user_roles.userId",
            "users.id"
        )

        .where({ 'roles': 'student' })
        .then((rows) => {
            if (rows.length > 0) {

                rows.map((usersDetails) => {

                    // console.log(key)
                    // console.log(usersDetails.email)
                    let courseObject = {
                        "receiverEmail": usersDetails.email,
                        "messageArgs": {
                            "studentName": usersDetails.name,
                            "exerciseDetails": exerciseDetails
                        }
                    }
                    // console.log(courseObject)
                    sendCliqIntimationMessagetest(functionName, courseObject).then(result => {

                    })
                })

            }
        })
}

let _generateExerciseAddOrUpdateQuery = function (exerciseInfo) {
    let query = database('exercises')
        .where({ 'slug': exerciseInfo['slug'] })
        .then((rows) => {
            // a exercise with same slug exists
            if (rows.length > 0) {
                let dbReviewType = rows[0].reviewType;
                return database('exercises')
                    .where({ 'id': rows[0].id })
                    .update(exerciseInfo)
                    .then(() => {
                        return Promise.resolve(rows[0].id);
                    })
                    .then((exerciseId) => {

                        let temp = [];
                        temp['id'] = rows[0].id;
                        temp['name'] = rows[0].name;
                        temp['slug'] = rows[0].slug;
                        temp['courseId'] = rows[0].courseId;
                        temp['flag'] = 'update';

                        sendAllUserMessage(temp,'courseChangesConceptChanged');


                        // if the review type has changed then we will need to delete the submissions too
                        if (dbReviewType !== exerciseInfo['reviewType']) {
                            return database('submissions')
                                .where({ 'exerciseId': rows[0].id })
                                .delete()
                                .then(() => {
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
                    .then((rows) => {

                        let temp = [];
                        temp['id'] = rows[0];
                        temp['name'] = exerciseInfo.name;
                        temp['slug'] = exerciseInfo.slug;
                        temp['courseId'] = exerciseInfo.courseId;
                        temp['courseName'] = globals.courseData['info']['name'];
                        temp['flag'] = 'insert';

                        sendAllUserMessage(temp,'courseChangesConceptAdded');

                        return Promise.resolve(rows[0]);
                    });
            }
        });
    return query;
};

// export const findFacilitator = function(email) {
//     return database('users')
//                 .select('users.id')
//                 .where({
//                     'users.email': email
//                 })
//                 .then((rows) => {
//                     if (rows.length < 1){
//                         // if there is user in the platform for the given facilitator email in the course
//                         // then select the default facilitatorEmail from configurations

//                         let facilitatorEmails = serverConfigs.facilitatorEmails;
//                         if (facilitatorEmails.length !== 0){
//                             let facilitatorEmail = facilitatorEmails[((Math.random() * facilitatorEmails.length)|0)];

//                             return database('users')
//                                     .select('users.id')
//                                     .where({
//                                         'users.email':facilitatorEmail
//                                     })
//                                     .then((response) => {
//                                         if (response.length >= 1){
//                                             return Promise.resolve({facilitator:response[0].id});
//                                         } else {
//                                             // if there is no data for the given email on the platform
//                                             console.warn("Warning: Please sign-in using the given"
//                                                 + " facilitator emails in config to submit assignment.");
//                                             return Promise.resolve({facilitator:null});
//                                         }
//                                     });

//                         } else {
//                             // if there is no facilitator in the config
//                             return Promise.resolve({facilitator: null});
//                         }

//                     } else {
//                         return Promise.resolve({facilitator:rows[0].id});
//                     }
//         });
// };

export const addOrUpdateExercises = function (exercises, courseId, promiseObj?) {
    let exInsertQs = [];
    let solution;
    for (let i = 0; i < exercises.length; i++) {
        if (!(exercises[i]["isSolutionFile"])) {
            solution = null;
            if (i < (exercises.length - 1) && exercises[i + 1]["isSolutionFile"]) {
                solution = exercises[i + 1]["content"];
            }
            let exerciseObj = {
                courseId: courseId,
                name: exercises[i]['name'],
                slug: exercises[i]['slug'],
                sequenceNum: exercises[i]['sequenceNum'],
                reviewType: 'peer',//exercises[i]['completionMethod'],
                content: exercises[i]['content'],
                solution: solution,
                submissionType: exercises[i]['submissionType'],
                githubLink: exercises[i]['githubLink']
            };

            let query;
            if (!promiseObj) {
                query = _generateExerciseAddOrUpdateQuery(exerciseObj);
            } else {
                promiseObj.then((exerciseId) => {
                    exerciseObj['parentExerciseId'] = exerciseId;
                    query = _generateExerciseAddOrUpdateQuery(exerciseObj);
                    return query;
                });
            }

            if (exercises[i].childExercises && exercises[i].childExercises.length > 0) {
                addOrUpdateExercises(exercises[i].childExercises, courseId, query);
            }

            exInsertQs.push(query);
        }
    }
    return exInsertQs;
};

export const addOrUpdateCourse = function () {
    let courseDetails = [];
    return database('courses')
        .select('*')
        .where({ 'name': globals.courseData['info']['name'] })
        .then((rows) => {
            if (rows.length > 0) {
                return Promise.resolve(rows[0]);
            } else {
                return Promise.resolve(null);
            }
        }).then((row) => {
            return database('courses').select(database.raw('MAX(sequenceNum) as sequenceNum'))
                .then((rows) => {
                    let newSequenceNum = rows[0].sequenceNum || 0;
                    newSequenceNum++;
                    return Promise.resolve(newSequenceNum);
                }).then((newSequenceNum) => {
                    if (row == null) {
                        return database('courses').insert({
                            'type': globals.courseData['info']['type'],
                            'name': globals.courseData['info']['name'],
                            'logo': globals.courseData['info']['logo'],
                            'shortDescription': globals.courseData['info']['shortDescription'],
                            'daysToComplete': globals.courseData['info']['daysToComplete'],
                            'sequenceNum': newSequenceNum,
                            // 'notes': globals.courseData['notes'],
                        })
                            .then((rows) => {

                                globals.courseData['info']['courseId'] = rows[0]
                                courseDetails.push(globals.courseData.info)

                                database('users')
                                    .select('users.email', 'users.name')
                                    .innerJoin(
                                        "user_roles",
                                        "user_roles.userId",
                                        "users.id"
                                    )

                                    .where({ 'roles': 'student' })
                                    .then((rows) => {
                                        if (rows.length > 0) {

                                            rows.map((usersDetails) => {

                                                // console.log(key)
                                                // console.log(usersDetails.email)
                                                let courseObject = {
                                                    "receiverEmail": usersDetails.email,
                                                    "messageArgs": {
                                                        "studentName": usersDetails.name,
                                                        "courseDetails": courseDetails
                                                    }
                                                }
                                                // console.log(courseObject)
                                                sendCliqIntimationMessagetest('newCourseAdded', courseObject).then(result => {

                                                })
                                            })

                                        }
                                    })


                                return Promise.resolve(rows[0]);
                            });
                    } else {
                        const { id: courseId, sequenceNum } = row;

                        return database('courses')
                            .where({ 'name': globals.courseData['info']['name'] })
                            .update({
                                // Not updating `type` and `name` as assuming they won't change
                                'logo': globals.courseData['info']['logo'],
                                'shortDescription': globals.courseData['info']['shortDescription'],
                                'daysToComplete': globals.courseData['info']['daysToComplete'],
                                // Updating course sequenceNum as maximum of existing sequenceNum+1
                                // when it is null or else just leave it.
                                'sequenceNum': sequenceNum ? sequenceNum : newSequenceNum,
                            })
                            .then(() => {
                                return Promise.resolve(courseId);
                            });
                    }
                });
        });
};

export const deleteExercises = function (courseId) {
    database('exercises')
        .select('slug')
        .where({ 'courseId': courseId })
        .then((rows) => {
            let slugs = [];
            for (let i = 0; i < rows.length; i++) {
                slugs.push(rows[i]['slug']);
            }
            return Promise.resolve(slugs);
        })
        .then((dbSlugs) => {
            // get the slugs which exist in the DB but not in the slug list we have
            // those ones need to be deleted
            let slugDiff = dbSlugs.filter(function (x) { return globals.allSlugs.indexOf(x) < 0; });
            // delete the exercises with the slugs where the slugs are in slug diff
            let deleteQueries = [];
            for (let i = 0; i < slugDiff.length; i++) {
                deleteQueries.push(
                    database('exercises')
                        .select('id')
                        .where({ 'slug': slugDiff[i] })
                        .then((rows) => {
                            let exId = rows[0].id;
                            return database('submissions')
                                .where({ 'exerciseId': exId })
                                .delete()
                                .then(() => {
                                    return database('exercises')
                                        .where({ 'slug': slugDiff[i] })
                                        .delete();
                                });
                        })
                );
            }
            return Promise.all(deleteQueries).then(() => {
                return Promise.resolve(true);
            });
        });
};