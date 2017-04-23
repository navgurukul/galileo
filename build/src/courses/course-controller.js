"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CourseController {
    constructor(configs, database) {
        this.database = database;
        this.configs = configs;
    }
    getCoursesList(request, reply) {
        return reply({
            "data": [
                {
                    id: 532,
                    name: "Primary Logic 101",
                    link: "python",
                    description: "Primary Logic using Python 2.7",
                    totalExercises: 123,
                    daysToComplete: 40,
                    enrolled: false,
                    enrolledBatch: null,
                },
                {
                    id: 123,
                    name: "JavaScript Basics",
                    link: "js",
                    description: "Basic JS 101 before getting into web-dev.",
                    totalExercises: 90,
                    daysToComplete: 25,
                    enrolled: true,
                    facilitatingFor: [1, 2, 3],
                    enrolledBatch: 12
                },
                {
                    id: 145,
                    name: "HTML / CSS Basics",
                    link: "html",
                    description: "Get yourself to develop any god-damn page under the sun.",
                    totalExercises: 50,
                    daysToComplete: 15,
                    enrolled: true,
                    enrolledBatch: 34
                }
            ]
        });
    }
    getCourseExercises(request, reply) {
        return reply({
            data: [
                {
                    id: 241,
                    title: "What is Python?",
                    slug: "what-is-python",
                    content: "# Some heading \n ## Some sub-heading \n Some content.",
                    parentExercise: null,
                    completed: true,
                    completedOn: Date.now(),
                    timeTakenToComplete: 12343,
                    completionType: "manual",
                    assignmentReviewType: null
                },
                {
                    id: 242,
                    title: "Constants & Variables in Programming Languages",
                    slug: "constants-variables-in-programming-languages",
                    content: "# Some heading \n ## Some sub-heading \n Some content.",
                    parentExercise: null,
                    completed: false,
                    completedOn: null,
                    timeTakenToComplete: null,
                    completionType: "assignment",
                    assignmentReviewType: "auto"
                },
                {
                    id: 244,
                    title: "Variable Names & Reserved Words",
                    slug: "variable-names-reserved-words",
                    content: "# Some heading \n ## Some sub-heading \n Some content.",
                    parentExercise: 242,
                    completed: false,
                    completedOn: null,
                    timeTakenToComplete: null,
                    completionType: "assignment",
                    assignmentReviewType: "peer"
                }
            ]
        });
    }
    getExerciseById(request, reply) {
        return reply({
            id: 244,
            title: "Variable Names & Reserved Words",
            slug: "variable-names-reserved-words",
            content: "# Some heading \n ## Some sub-heading \n Some content.",
            parentExercise: 242,
            completed: false,
            completedOn: null,
            timeTakenToComplete: null,
            completionType: "assignment",
            assignmentReviewType: "peer"
        });
    }
    getCourseNotes(request, reply) {
        reply({
            "notes": "# Some Heading ## Some sub-heading ## Some more sub-heading. Some text."
        });
    }
    enrollInCourse(request, reply) {
        return reply({
            id: 123,
            name: "JavaScript Basics",
            description: "Basic JS 101 before getting into web-dev.",
            totalExercises: 90,
            daysToComplete: 25,
            enrolled: true,
            facilitatingFor: [1, 2]
        });
    }
}
exports.default = CourseController;
//# sourceMappingURL=course-controller.js.map