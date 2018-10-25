
import database from '../index';
var globals = require('./globals');

let _generateExerciseAddOrUpdateQuery = function(exerciseInfo) {
    let query = database('exercises')
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

export const addOrUpdateExercises = function(exercises, courseId, promiseObj?) {
    let exInsertQs = [];
    for (let i = 0; i < exercises.length; i++) {
        let exerciseObj = {
            courseId: courseId,
            name: exercises[i]['name'],
            slug: exercises[i]['slug'],
            sequenceNum: exercises[i]['sequenceNum'],
            reviewType: exercises[i]['completionMethod'],
            content: exercises[i]['content'],
            githubLink: exercises[i]['githubLink']
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

export const addOrUpdateCourse = function() {
    return database('courses')
    .select('*')
    .where({ 'name': globals.courseData['info']['name'] })
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
                'type': globals.courseData['info']['type'],
                'name': globals.courseData['info']['name'],
                'logo': globals.courseData['info']['logo'],
                'shortDescription': globals.courseData['info']['shortDescription'],
                'daysToComplete': globals.courseData['info']['daysToComplete'],
                // 'notes': globals.courseData['notes'],
            })
            .then( (rows) => {
                return Promise.resolve(rows[0]);
            });
        } else {
            return database('courses')
            .where({ 'name': globals.courseData['info']['name'] })
            .update({ // Not updating `type` and `name` as assuming they won't change
                'logo': globals.courseData['info']['logo'],
                'shortDescription': globals.courseData['info']['shortDescription'],
                'daysToComplete': globals.courseData['info']['daysToComplete'],
            })
            .then( () => {
                return Promise.resolve(courseId);
            });
        }
    });
};

export const deleteExercises = function(courseId) {
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
                    .where({'exerciseId': exId})
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
