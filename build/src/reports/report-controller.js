"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ReportController {
    constructor(configs, database) {
        this.database = database;
        this.configs = configs;
    }
    getBatchCourseReport(request, reply) {
        return reply({
            data: [
                {
                    id: 241,
                    title: "What is Python?",
                    slug: "what-is-python",
                    content: "# Some heading \n ## Some sub-heading \n Some content.",
                    parentExercise: null,
                    assignmentReviewType: null,
                    completionDetails: [
                        {
                            userId: 32,
                            completed: true,
                            completedOn: Date.now(),
                            timeTakenToComplete: 3600,
                            attemptsTaken: 2
                        },
                        {
                            userId: 45,
                            completed: false,
                            completedOn: null,
                            timeTakenToComplete: null,
                            attemptsTaken: 3
                        },
                        {
                            userId: 76,
                            completed: true,
                            completedOn: Date.now(),
                            timeTakenToComplete: 36000,
                            attemptsTaken: 1
                        }
                    ]
                },
                {
                    id: 242,
                    title: "Constants & Variables in Programming Languages",
                    slug: "constants-variables-in-programming-languages",
                    content: "# Some heading \n ## Some sub-heading \n Some content.",
                    parentExercise: null,
                    assignmentReviewType: "auto",
                    completionDetails: [
                        {
                            userId: 32,
                            completed: true,
                            completedOn: Date.now(),
                            timeTakenToComplete: 3600,
                            attemptsTaken: 2
                        },
                        {
                            userId: 45,
                            completed: false,
                            completedOn: null,
                            timeTakenToComplete: null,
                            attemptsTaken: 3
                        },
                        {
                            userId: 76,
                            completed: false,
                            completedOn: null,
                            timeTakenToComplete: null,
                            attemptsTaken: 5
                        }
                    ]
                },
            ]
        });
    }
}
exports.default = ReportController;
//# sourceMappingURL=report-controller.js.map