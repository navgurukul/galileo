var _ = require('underscore');
import * as Configs from "../configurations";
import database from "../";

export const getIsSolutionAvailable = function (exercise) {
    let isSolutionAvailable = true;
    if (exercise.solution === null) {
        isSolutionAvailable = false;
    }
    return isSolutionAvailable;
};


export const manipulateResultSet=function (totalExercisesperCourse, exrcisesCompletedPerCourse, courseReliesOn, availableCourses,
     CourseCompletionCriteria) {
    // console.log('totalExercisesperCourse');
    // console.log(totalExercisesperCourse);
    // console.log('totalExercisesperCourse');

    // console.log('exrcisesCompletedPerCourse');
    // console.log(exrcisesCompletedPerCourse);
    // console.log('exrcisesCompletedPerCourse');


    // console.log('courseReliesOn');
    // console.log(courseReliesOn);
    // console.log('courseReliesOn');


    // console.log('availableCourses');
    // console.log(availableCourses);
    // console.log('availableCourses');

    // console.log('CourseCompletionCriteria');
    // console.log(CourseCompletionCriteria);
    // console.log('CourseCompletionCriteria');

    /* **Merge totalExercisesperCourse,  exrcisesCompletedPerCourse to generate a single array ** */    
    let mergedArrs = [...totalExercisesperCourse, ...exrcisesCompletedPerCourse];
    let courseCompletionPecentage;
    let coursesNotCompletedWithDependency = [];
    const noDuplicate=arr=>[...new Set(arr)];
    const allIds=mergedArrs.map(ele=>ele.courseId);
    const ids=noDuplicate(allIds);
    /* **result array contains total number of exercises in each course and the exercises completed per course** */
    const result = ids.map(id =>
        mergedArrs.reduce((self, item) => {
            return item.courseId === id ? { ...self, ...item } : self;
        }, {})
    );
    /* **Calculate the percentage completion for each course and check whether the completion criteria is met** */
    var courseExerciseDetails = result.map(course => {
        if (course.totalExercisesCompleted) {
            courseCompletionPecentage = parseFloat(((course["totalExercisesCompleted"] / course["totalExercises"]) * 100).toFixed(2));
            course["pecentageCompletion"] = courseCompletionPecentage;
            course["isCompletionCriteriaMet"] = courseCompletionPecentage >= CourseCompletionCriteria ? true : false;
        } else {
            course["totalExercisesCompleted"] = 0;
            course["pecentageCompletion"] = 0;
            course["isCompletionCriteriaMet"] = false;
        }
        return course;
    });
    // console.log('courseExerciseDetails');
    // console.log(courseExerciseDetails);
    // console.log('courseExerciseDetails');
   let id;
   let coursesWithDependecncy = _.uniq(_.pluck(courseReliesOn, 'courseId'));
   let groupListBycourseId =  _.groupBy(courseReliesOn, 'courseId');

   coursesWithDependecncy.map(courseId => {
       id = courseId.toString();
       if(!isCourseCompleteWithDependency(groupListBycourseId[id], courseExerciseDetails, courseId)) {
        coursesNotCompletedWithDependency.push(courseId);
       }
       
   }
    );
    return _.reject(availableCourses, function (course) { return _.contains(coursesNotCompletedWithDependency, course.id); });
};

function isCourseCompleteWithDependency(courseCompletedArray, courseExerciseDetails, id) {
    let isCourseCompleteWithDependency = true;
    for (let i = 0; i < courseCompletedArray.length; i++) {
        let isDepedencyCourseComplete = getIsCourseCompletionCriteriaMet(courseExerciseDetails, courseCompletedArray[i].reliesOn);
        if (!isDepedencyCourseComplete) {
            isCourseCompleteWithDependency = false;
            break;
        }
    }
    return isCourseCompleteWithDependency;
}


function getIsCourseCompletionCriteriaMet(courseExerciseDetails, id) {
    let course = _.where(courseExerciseDetails, { courseId: id });
    return course[0].isCompletionCriteriaMet;
}
export const listToTree = function (list) {
    var map = {}, node, roots = [], i;

    for (i = 0; i < list.length; i += 1) {
        map[list[i].menteeId] = i; // initialize the map
        list[i].children = []; // initialize the children
    }
    // console.log(map)
    // for (i = 0; i < list.length; i += 1) {
    for (i = 0; i < list.length; i++) {
        node = list[i];

        // console.log(i,node.menteeId,node.mentorId,map[node.mentorId], list[map[node.mentorId]]);
        //if (node.parent !== "0") {
        // if you have dangling branches check that map[node.parentId] exists

        //   if(map[node.mentorId]){
        if (map[node.mentorId] == 0 || map[node.mentorId] > 0) {
            list[map[node.mentorId]].children.push(node);
            // console.log('-------',list,'--------');
        } else {
            roots.push(node);
        }
    }

    return roots;
};

export const  isStudentEligibleToEnroll= async function(studentId, courseId){
        let TotalExercisesPerCourseQ;
        let exerciseCompeletedPerCourseQ;
        let courseReliesOnQ;
        let availableQ;
        let courseConfig = Configs.getCourseConfigs();
        TotalExercisesPerCourseQ = database('exercises')
        .select( 'exercises.courseId',
        database.raw('COUNT(exercises.id) as totalExercises')).groupBy('exercises.courseId')
        .then((rows) => {
            return Promise.resolve(rows);
        });
        
        exerciseCompeletedPerCourseQ =
        database('exercises')
            .select(database.raw('COUNT(exercises.id) as totalExercisesCompleted'), 
            'exercises.courseId')
            .where('exercises.id', 'in', database('submissions')
            .select('submissions.exerciseId').where({'submissions.completed':1})
            .andWhere('submissions.userId', '=', studentId) 
            ).groupBy('exercises.courseId')
            .then((rows) => {
                return Promise.resolve(rows);
            });
        
            courseReliesOnQ =
            database('course_relation')
                .select(
                'course_relation.courseId', 'course_relation.reliesOn'
                )
                .then((rows) => {
                    return Promise.resolve(rows);
                });

                availableQ =
                database('courses')
                    .select('courses.id', 'courses.name', 'courses.type',
                      'courses.logo', 'courses.shortDescription','courses.sequenceNum')
                    .where('courses.id', 'not in', database('courses').distinct()
                        .select('courses.id')
                        .join('course_enrolments', function () {
                            this.on('courses.id', '=', 'course_enrolments.courseId')
                                .andOn('course_enrolments.studentId', '=', studentId);
                        })
                    )
                    .then((rows) => {
                        return Promise.resolve(rows);
                    });

                    let a = Promise.all([availableQ, exerciseCompeletedPerCourseQ, TotalExercisesPerCourseQ, 
                        courseReliesOnQ]).then((resolvedValues) => {
                        let availableCourses = resolvedValues[0];
                        let exerciseCompeletedPerCourse = resolvedValues[1];
                        let totalExercisesPerCourse = resolvedValues[2];
                        let courseReliesOn = resolvedValues[3];
                        let coursesEligibleToEnrollIn = manipulateResultSet(totalExercisesPerCourse,exerciseCompeletedPerCourse, 
                        courseReliesOn, availableCourses, courseConfig.courseCompleteionCriteria);
                        // console.log('coursesEligibleToEnrollIn');
                        // console.log(coursesEligibleToEnrollIn);
                        // console.log('coursesEligibleToEnrollIn');
                         return _.where(coursesEligibleToEnrollIn, {id: courseId}).length > 0 ? true : false;
                    });
                    
                    let result = await a;
                    // console.log('result');
                    // console.log(result);
                    // console.log('result');
                    return result;
    }


export const addingRootNode = function (rootArray, ChildArray) {
    var i, j;
    //console.log(rootArray);
    for (i = 0; i < rootArray.length; i += 1) {

        rootArray[i].children = [];
        for (j = 0; j < ChildArray.length; j += 1) {
            if (rootArray[i].mentorId == ChildArray[j].mentorId) {
                rootArray[i].children.push(ChildArray[j]);
            }
        }
    }





    return rootArray;
}


export const getUserRoles = function (userDetails) {
    let userRoles = {
        isAdmin: false,
        isFacilitator: false,
        isAlumni: false,
        isTnp: false,
        roles: [],
        center: {
            isFacilitator: [],
            isAdmin: [],
            isAlumni: [],
            isTnp: [],
            
        }

    };

    for (let i = 0; i < userDetails.length; i++) {
        if (userDetails[i].roles === "facilitator") {
            userRoles['isFacilitator'] = true;
            userRoles['center'].isFacilitator.push(userDetails[i].center);
        } else if (userDetails[i].roles === "admin") {

            userRoles['isAdmin'] = true;
            userRoles.center.isAdmin.push(userDetails[i].center);

        } else if (userDetails[i].roles === "alumni") {

            userRoles['isAlumni'] = true;
            userRoles['center'].isAlumni.push(userDetails[i].center)
        } else if (userDetails[i].roles === "tnp") {

            userRoles['isTnp'] = true;
            userRoles['center'].isTnp.push(userDetails[i].center)
        } else {
            userRoles['roles'].push(userDetails[i].roles);
            if((userDetails[i].roles in userRoles['center'])==false)
            userRoles['center'][userDetails[i].roles]=[];
            userRoles['center'][userDetails[i].roles].push(userDetails[i].center);
        }
    }
  
   //  userRoles['roles']=JSON.stringify(userRoles['roles']);

    return userRoles;
}
