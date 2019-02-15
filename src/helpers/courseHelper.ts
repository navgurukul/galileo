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
    console.log('totalExercisesperCourse');
    console.log(totalExercisesperCourse);
    console.log('exrcisesCompletedPerCourse');
    console.log(exrcisesCompletedPerCourse);
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
    console.log('result');
    console.log(result);
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
    console.log('courseExerciseDetails start');
    console.log(courseExerciseDetails);
    console.log('courseExerciseDetails end');
   let id;
   let coursesWithDependecncy = _.uniq(_.pluck(courseReliesOn, 'courseId'));
   console.log('execisesCompletedInCourse starttttttttt');
   console.log(coursesWithDependecncy);
   console.log('execisesCompletedInCourse endddddddddddddd');
   let groupListBycourseId =  _.groupBy(courseReliesOn, 'courseId');

   coursesWithDependecncy.map(courseId => {
       id = courseId.toString();
       if(!isCourseCompleteWithDependency(groupListBycourseId[id], courseExerciseDetails, courseId)) {
        //console.log('courseId');
        //console.log(courseId);
        coursesNotCompletedWithDependency.push(courseId);
       }
       
   }
    );

    //console.log('$$$$$$$$$$$$',coursesNotCompletedWithDependency,'##########');
    //console.log('**********filtered courses start**********************');

    return _.reject(availableCourses, function(course){return _.contains(coursesNotCompletedWithDependency, course.id); });
    //console.log(_.reject(availableCourses, function(course){return _.contains(coursesNotCompletedWithDependency, course.id); }));
    //console.log('********* filtered courses end***************'); 
   //console.log('@@@@@@@@@@@@@@@@@@@', 'execisesCompletedInCourse', execisesCompletedInCourse, '********');
   //console.log('groupListBycourseId');
   //console.log(groupListBycourseId);
    
    //return courseExerciseDetails;
    //console.log('result');
    //console.log(avc);
    //console.log('@@@@@@@end@@@@@@@@@@');manipulateResultSet
};

function isCourseCompleteWithDependency (courseCompletedArray, courseExerciseDetails, id) {
    //console.log('courseCompletedArray');
    //console.log(courseCompletedArray);
    //console.log('id');
    //console.log(id);
    let isCourseCompleteWithDependency = true;
    for (let i=0; i<courseCompletedArray.length; i++) {
        let isDepedencyCourseComplete = getIsCourseCompletionCriteriaMet(courseExerciseDetails, courseCompletedArray[i].reliesOn);
        //console.log('isDepedencyCourseComplete');
        //console.log(isDepedencyCourseComplete);
        //console.log(courseCompletedArray[i].reliesOn);
        if (!isDepedencyCourseComplete) {
            isCourseCompleteWithDependency = false;
            break;
        }
    }
    return isCourseCompleteWithDependency;
    //console.log('inside isCourseCompleteWithDependency');
}


function getIsCourseCompletionCriteriaMet(courseExerciseDetails, id){
     //console.log('courseExerciseDetails');
     //console.log(courseExerciseDetails);
     //console.log('id');
     //console.log(id);
     let course = _.where(courseExerciseDetails, {courseId: id});
     //console.log('+++++++++++ COURSE ++++++++++++++++++++');
     //console.log(course);
     return course[0].isCompletionCriteriaMet;
}
