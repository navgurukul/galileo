var _ = require('underscore');

export const getIsSolutionAvailable=function (exercise) {
    let isSolutionAvailable = true;
    if (exercise.solution === null) {
        isSolutionAvailable = false;
    }
    return isSolutionAvailable;
};


export const manipulateResultSet=function (totalExercisesperCourse, exrcisesCompletedPerCourse, courseReliesOn, availableCourses,
     CourseCompletionCriteria) {
    /* **Merge totalExercisesperCourse,  exrcisesCompletedPerCourse to generate a single array ** */    
    let mergedArrs = [...totalExercisesperCourse, ...exrcisesCompletedPerCourse];
    let courseCompletionPecentage;
    let coursesNotCompletedWithDependency = [];
    const noDuplicate=arr=>[...new Set(arr)];
    const allIds=mergedArrs.map(ele=>ele.courseId);
    const ids=noDuplicate(allIds);

    /* **result array contains total number of exercises in each course and the exercises completed per course** */
    const result=ids.map(id=>
        mergedArrs.reduce((self,item)=>{
            return item.courseId===id ? {...self,...item} : self;  
        },{})
    );
    /* **Calculate the percentage completion for each course and check whether the completion criteria is met** */
    var courseExerciseDetails = result.map(course=>{
        if(course.totalExercisesCompleted) {
            courseCompletionPecentage = parseFloat(((course["totalExercisesCompleted"]/course["totalExercises"]) * 100).toFixed(2));
            course["pecentageCompletion"] = courseCompletionPecentage;
            course["isCompletionCriteriaMet"] = courseCompletionPecentage>=CourseCompletionCriteria ? true : false;
        }else {
            course["totalExercisesCompleted"] = 0;
            course["pecentageCompletion"] = 0;
            course["isCompletionCriteriaMet"] = false;
        }
        return course;
    });
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
    return _.reject(availableCourses, function(course){return _.contains(coursesNotCompletedWithDependency, course.id); });
};

function isCourseCompleteWithDependency (courseCompletedArray, courseExerciseDetails, id) {
    let isCourseCompleteWithDependency = true;
    for (let i=0; i<courseCompletedArray.length; i++) {
        let isDepedencyCourseComplete = getIsCourseCompletionCriteriaMet(courseExerciseDetails, courseCompletedArray[i].reliesOn);
        if (!isDepedencyCourseComplete) {
            isCourseCompleteWithDependency = false;
            break;
        }
    }
    return isCourseCompleteWithDependency;
}


function getIsCourseCompletionCriteriaMet(courseExerciseDetails, id){
     let course = _.where(courseExerciseDetails, {courseId: id});
     return course[0].isCompletionCriteriaMet;
}
export const listToTree =function (list) {
    var map = {}, node, roots = [], i;
    
    for (i = 0; i < list.length; i += 1) {
        map[list[i].menteeId] = i; // initialize the map
        list[i].children = []; // initialize the children
    }
    
    for (i = 0; i < list.length; i += 1) {
        node = list[i];
        //if (node.parent !== "0") {
            // if you have dangling branches check that map[node.parentId] exists
            if(map[node.mentorId]){
            list[map[node.mentorId]].children.push(node);
        } else {
            roots.push(node);
        }
    }
    
    return roots;
}
