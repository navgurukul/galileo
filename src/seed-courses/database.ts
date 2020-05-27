
import database from '../index';
var globals = require('./globals');

import * as Configs from "../configurations";
let serverConfigs = Configs.getServerConfigs();


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

export const addOrUpdateExercises = function(exercises, course_id, promiseObj?) {
    let exInsertQs = [];
    let solution;
    for (let i = 0; i < exercises.length; i++) {
        if (!(exercises[i]["isSolutionFile"])) {
            solution = null;
            if (i<(exercises.length-1) && exercises[i+1]["isSolutionFile"]) {
                solution = exercises[i+1]["content"];
            }
            let exerciseObj = {
                course_id: course_id,
                name: exercises[i]['name'],
                slug: exercises[i]['slug'],
                sequence_num: exercises[i]['sequence_num'],
                review_type: 'peer',//exercises[i]['completionMethod'],
                content: exercises[i]['content'],
                solution: solution,
                submission_type: exercises[i]['submission_type'],
                github_link: exercises[i]['github_link']
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
    }
    return exInsertQs;
};

export const addOrUpdateCourse = function() {
    return database('courses')
    .select('*')
    .where({ 'name': globals.courseData['info']['name'] })
    .then( (rows) => {
        if (rows.length > 0) {
            return Promise.resolve(rows[0]);
        } else {
            return Promise.resolve(null);
        }
    }).then( (row) => {
        return database('courses').select(database.raw('MAX(sequence_num) as sequence_num'))
            .then((rows)=>{
                let newSequenceNum = rows[0].sequence_num || 0;
                newSequenceNum++;
                return Promise.resolve(newSequenceNum);
            }).then( (newSequenceNum) => {
                if (row == null) {
                    return database('courses').insert({
                        'type': globals.courseData['info']['type'],
                        'name': globals.courseData['info']['name'],
                        'logo': globals.courseData['info']['logo'],
                        'short_description': globals.courseData['info']['short_description'],
                        'days_to_complete': globals.courseData['info']['days_to_complete'],
                        'sequence_num': newSequenceNum,
                        // 'notes': globals.courseData['notes'],
                    })
                    .then( (rows) => {
                        return Promise.resolve(rows[0]);
                    });
                } else {
                    const { id:course_id, sequence_num } = row;

                    return database('courses')
                            .where({ 'name': globals.courseData['info']['name'] })
                            .update({
                                // Not updating `type` and `name` as assuming they won't change
                                'logo': globals.courseData['info']['logo'],
                                'short_description': globals.courseData['info']['short_description'],
                                'days_to_complete': globals.courseData['info']['days_to_complete'],
                                // Updating course sequence_num as maximum of existing sequence_num+1
                                // when it is null or else just leave it.
                                'sequence_num': sequence_num? sequence_num:newSequenceNum,
                            })
                            .then( () => {
                                return Promise.resolve(course_id);
                            });
                }
            });
    });
};

export const deleteExercises = function(course_id) {
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
        let slugDiff = dbSlugs.filter(function(x) { return globals.allSlugs.indexOf(x) < 0; });
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
