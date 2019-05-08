import database from '../index';
var globals = require('./globals');

import * as Configs from "../configurations";
import {
    sendCliqIntimation,
    sendCliqIntimationTest,
    sendCliqIntimationMessagetest
} from "../cliq";
import { promises } from 'fs';
let serverConfigs = Configs.getServerConfigs();


let _generateExerciseAddOrUpdateQuery = function (exerciseInfo) {
    let query = database('exercises')
        .where({ 'slug': exerciseInfo['slug'] })
        .then((rows) => {
            // a exercise with same slug exists


            if (rows.length > 0) {

                //  console.log("i am in update============");
                let dbReviewType = rows[0].reviewType;
                return database('exercises')
                    .where({ 'id': rows[0].id })
                    .update(exerciseInfo)
                    .then(() => {
                        return Promise.resolve(rows[0]);
                    })
                    .then((exerciseId) => {

                        exerciseId['functionality'] = 'update';
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
                // console.log("i am in insert=================");
                return database('exercises')
                    .insert(exerciseInfo)
                    .then((rows) => {

                        rows[0]['functionality'] = 'insert';
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
    let excerciseDetails = [];
    let solution;
    return new Promise((resolve, reject) => {
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

                    query.then((result) => {

                        // console.log("With out promiseObject===>", result);
                        excerciseDetails.push(result);

                    })

                } else {
                    promiseObj.then((exerciseId) => {


                        //   console.log("<---------------------------->")
                        //  console.log(exerciseId.id);
                        //   console.log("I am in the else block--------------------------->")

                        exerciseObj['parentExerciseId'] = exerciseId.id;
                        query = _generateExerciseAddOrUpdateQuery(exerciseObj);
                        query.then((result) => {
                            // console.log("With  promiseObject===>", result);

                            excerciseDetails.push(result);

                        })

                        return query;
                    });
                }




                if (exercises[i].childExercises && exercises[i].childExercises.length > 0) {

                    addOrUpdateExercises(exercises[i].childExercises, courseId, query);
                }

                exInsertQs.push(query);
            }
        }
    }).then(() => {

        database('courses')
            // .select("courses.id as courseId", 'exercises.id as id', "exercises.slug")
            .select("courses.id as courseId", 'users.id as id')
            .innerJoin(
                "course_enrolments",
                "course_enrolments.courseId",
                "courses.id"
            )
            .innerJoin(
                "users",
                "course_enrolments.studentId",
                "users.id"
            )

            .where({ 'courses.id': courseId })
            .then((rows) => {
                //  console.log("************************************************************************", excerciseDetails.length)
                // console.log(excerciseDetails);
                // let courseObject = {
                //     "receiverEmail": student.email,
                //     "messageArgs": {
                //         "percent": "",
                //         "courseName":rows[0].name,
                //         "exerciseDetails": exerciseInfo
                //     }
                // }

                // sendCliqIntimationMessagetest('courseChangesConceptChanged', courseObject).then(result => {

                // })

                rows.map((key, value) => {
                    //    console.log("I am here in the loop")
                    //    console.log(key)
                    //    console.log(value)
                })

            });


    })



    return exInsertQs;
};

export const addOrUpdateCourse = function () {

let courseDetails=[];

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
                        console.log("I am in add ection --------------------------")
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
                        console.log("I am in else ection --------------------------", globals.courseData['info']['name'])
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
        })

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