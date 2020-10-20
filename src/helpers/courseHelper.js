"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserRoles = exports.addingRootNode = exports.isStudentEligibleToEnroll = exports.listToTree = exports.manipulateResultSet = exports.getIsSolutionAvailable = void 0;
var _ = require("underscore");
const Configs = require("../configurations");
const __1 = require("../");
exports.getIsSolutionAvailable = function (exercise) {
    let isSolutionAvailable = true;
    if (exercise.solution === null) {
        isSolutionAvailable = false;
    }
    return isSolutionAvailable;
};
exports.manipulateResultSet = function (totalExercisesperCourse, exrcisesCompletedPerCourse, courseReliesOn, availableCourses, CourseCompletionCriteria) {
    /* **Merge totalExercisesperCourse,  exrcisesCompletedPerCourse to generate a single array ** */
    let mergedArrs = [
        ...totalExercisesperCourse,
        ...exrcisesCompletedPerCourse
    ];
    let courseCompletionPecentage;
    let coursesNotCompletedWithDependency = [];
    const noDuplicate = arr => [...new Set(arr)];
    const allIds = mergedArrs.map(ele => ele.course_id);
    const ids = noDuplicate(allIds);
    /* **result array contains total number of exercises in each course and the exercises completed per course** */
    const result = ids.map(id => mergedArrs.reduce((self, item) => {
        return item.course_id === id ? Object.assign(Object.assign({}, self), item) : self;
    }, {}));
    /* **Calculate the percentage completion for each course and check whether the completion criteria is met** */
    var courseExerciseDetails = result.map(course => {
        if (course.totalExercisesCompleted) {
            courseCompletionPecentage = parseFloat(((course["totalExercisesCompleted"] /
                course["totalExercises"]) *
                100).toFixed(2));
            course["pecentageCompletion"] = courseCompletionPecentage;
            course["isCompletionCriteriaMet"] =
                courseCompletionPecentage >= CourseCompletionCriteria
                    ? true
                    : false;
        }
        else {
            course["totalExercisesCompleted"] = 0;
            course["pecentageCompletion"] = 0;
            course["isCompletionCriteriaMet"] = false;
        }
        return course;
    });
    let id;
    let coursesWithDependecncy = _.uniq(_.pluck(courseReliesOn, "course_id"));
    let groupListBycourse_id = _.groupBy(courseReliesOn, "course_id");
    coursesWithDependecncy.map(course_id => {
        id = course_id.toString();
        if (!isCourseCompleteWithDependency(groupListBycourse_id[id], courseExerciseDetails, course_id)) {
            coursesNotCompletedWithDependency.push(course_id);
        }
    });
    return _.reject(availableCourses, function (course) {
        return _.contains(coursesNotCompletedWithDependency, course.id);
    });
};
function isCourseCompleteWithDependency(courseCompletedArray, courseExerciseDetails, id) {
    let isCourseCompleteWithDependency = true;
    for (let i = 0; i < courseCompletedArray.length; i++) {
        let isDepedencyCourseComplete = getIsCourseCompletionCriteriaMet(courseExerciseDetails, courseCompletedArray[i].relies_on);
        if (!isDepedencyCourseComplete) {
            isCourseCompleteWithDependency = false;
            break;
        }
    }
    return isCourseCompleteWithDependency;
}
function getIsCourseCompletionCriteriaMet(courseExerciseDetails, id) {
    let course = _.where(courseExerciseDetails, { course_id: id });
    return course[0].isCompletionCriteriaMet;
}
exports.listToTree = function (list) {
    var map = {}, node, roots = [], i;
    for (i = 0; i < list.length; i += 1) {
        map[list[i].menteeId] = i; // initialize the map
        list[i].children = []; // initialize the children
    }
    // 
    // for (i = 0; i < list.length; i += 1) {
    for (i = 0; i < list.length; i++) {
        node = list[i];
        // 
        //if (node.parent !== "0") {
        // if you have dangling branches check that map[node.parentId] exists
        //   if(map[node.mentorId]){
        if (map[node.mentorId] == 0 || map[node.mentorId] > 0) {
            list[map[node.mentorId]].children.push(node);
            // 
        }
        else {
            roots.push(node);
        }
    }
    return roots;
};
exports.isStudentEligibleToEnroll = function (student_id, course_id) {
    return __awaiter(this, void 0, void 0, function* () {
        let TotalExercisesPerCourseQ;
        let exerciseCompeletedPerCourseQ;
        let courseReliesOnQ;
        let availableQ;
        let courseConfig = Configs.getCourseConfigs();
        TotalExercisesPerCourseQ = __1.default("exercises")
            .select("exercises.course_id", __1.default.raw("COUNT(exercises.id) as totalExercises"))
            .groupBy("exercises.course_id")
            .then(rows => {
            return Promise.resolve(rows);
        });
        exerciseCompeletedPerCourseQ = __1.default("exercises")
            .select(__1.default.raw("COUNT(exercises.id) as totalExercisesCompleted"), "exercises.course_id")
            .where("exercises.id", "in", __1.default("submissions")
            .select("submissions.exercise_id")
            .where({ "submissions.completed": 1 })
            .andWhere("submissions.user_id", "=", student_id))
            .groupBy("exercises.course_id")
            .then(rows => {
            return Promise.resolve(rows);
        });
        courseReliesOnQ = __1.default("course_relation")
            .select("course_relation.course_id", "course_relation.relies_on")
            .then(rows => {
            return Promise.resolve(rows);
        });
        availableQ = __1.default("courses")
            .select("courses.id", "courses.name", "courses.type", "courses.logo", "courses.short_description")
            .where("courses.id", "not in", __1.default("courses")
            .distinct()
            .select("courses.id")
            .join("course_enrolments", function () {
            this.on("courses.id", "=", "course_enrolments.course_id").andOn("course_enrolments.student_id", "=", student_id);
        }))
            .then(rows => {
            return Promise.resolve(rows);
        });
        let a = Promise.all([
            availableQ,
            exerciseCompeletedPerCourseQ,
            TotalExercisesPerCourseQ,
            courseReliesOnQ
        ]).then(resolvedValues => {
            let availableCourses = resolvedValues[0];
            let exerciseCompeletedPerCourse = resolvedValues[1];
            let totalExercisesPerCourse = resolvedValues[2];
            let courseReliesOn = resolvedValues[3];
            let coursesEligibleToEnrollIn = exports.manipulateResultSet(totalExercisesPerCourse, exerciseCompeletedPerCourse, courseReliesOn, availableCourses, courseConfig.courseCompleteionCriteria);
            // 
            // 
            // 
            return _.where(coursesEligibleToEnrollIn, { id: course_id }).length > 0
                ? true
                : false;
        });
        let result = yield a;
        // 
        // 
        // 
        return result;
    });
};
exports.addingRootNode = function (rootArray, ChildArray) {
    var i, j;
    //
    for (i = 0; i < rootArray.length; i += 1) {
        rootArray[i].children = [];
        for (j = 0; j < ChildArray.length; j += 1) {
            if (rootArray[i].mentorId == ChildArray[j].mentorId) {
                rootArray[i].children.push(ChildArray[j]);
            }
        }
    }
    return rootArray;
};
exports.getUserRoles = function (userDetails) {
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
            isTnp: []
        }
    };
    for (let i = 0; i < userDetails.length; i++) {
        if (userDetails[i].roles === "facilitator") {
            userRoles["isFacilitator"] = true;
            userRoles["center"].isFacilitator.push(userDetails[i].center);
        }
        else if (userDetails[i].roles === "admin") {
            userRoles["isAdmin"] = true;
            userRoles.center.isAdmin.push(userDetails[i].center);
        }
        else if (userDetails[i].roles === "alumni") {
            userRoles["isAlumni"] = true;
            userRoles["center"].isAlumni.push(userDetails[i].center);
        }
        else if (userDetails[i].roles === "tnp") {
            userRoles["isTnp"] = true;
            userRoles["center"].isTnp.push(userDetails[i].center);
        }
        else {
            userRoles["roles"].push(userDetails[i].roles);
            if (userDetails[i].roles in userRoles["center"] == false)
                userRoles["center"][userDetails[i].roles] = [];
            userRoles["center"][userDetails[i].roles].push(userDetails[i].center);
        }
    }
    //  userRoles['roles']=JSON.stringify(userRoles['roles']);
    return userRoles;
};
//# sourceMappingURL=courseHelper.js.map