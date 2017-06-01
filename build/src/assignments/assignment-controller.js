"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AssignmentController {
    constructor(configs, database) {
        this.database = database;
        this.configs = configs;
    }
    postExerciseSubmission(request, reply) {
        return reply({
            files: [
                "http://cloud.google.com/some_filename.html",
                "http://cloud.google.com/some_more.css",
                "http://cloud.google.com/evenmore.js"
            ],
            notes: "Some notes.",
            submittedAt: Date.now(),
            userId: 1242
        });
    }
    getExerciseSubmissions(request, reply) {
        return reply({
            data: [
                {
                    files: [
                        "http://cloud.google.com/randId1_some_filename.html",
                        "http://cloud.google.com/randId1_some_more.css",
                        "http://cloud.google.com/randId1_evenmore.js"
                    ],
                    notes: "Some notes.",
                    submittedAt: Date.now(),
                    userId: 1242
                },
                {
                    files: [
                        "http://cloud.google.com/randId2_some_filename.html",
                        "http://cloud.google.com/randId2_some_more.css",
                        "http://cloud.google.com/randId2_evenmore.js"
                    ],
                    notes: null,
                    submittedAt: Date.now(),
                    userId: 121
                },
                {
                    files: [
                        "http://cloud.google.com/randId12_some_filename.html",
                    ],
                    notes: "I did it using reverse() instead of manually writing mine on my own.",
                    submittedAt: Date.now(),
                    userId: 76
                }
            ]
        });
    }
    getExerciseSubmissionById(request, reply) {
        return reply({
            files: [
                "http://cloud.google.com/randId1_some_filename.html",
                "http://cloud.google.com/randId1_some_more.css",
                "http://cloud.google.com/randId1_evenmore.js"
            ],
            notes: "Some notes.",
            submittedAt: Date.now(),
            userId: 1242
        });
    }
    getPeerReviewRequests(request, reply) {
        reply({
            "data": [
                {
                    id: 471,
                    reviewerId: 75,
                    submissionObject: {
                        files: [
                            "http://cloud.google.com/randId1_some_filename.html",
                            "http://cloud.google.com/randId1_some_more.css",
                            "http://cloud.google.com/randId1_evenmore.js"
                        ],
                        notes: "Some notes.",
                        submittedAt: Date.now(),
                        userName: "shivam"
                    },
                    approved: true,
                    notes: "Jaldi kar dio bhai!!"
                },
                {
                    id: 213,
                    reviewerId: 75,
                    submissionObject: {
                        files: [
                            "http://cloud.google.com/randId1_some_filename.html",
                            "http://cloud.google.com/randId1_some_more.css",
                            "http://cloud.google.com/randId1_evenmore.js"
                        ],
                        notes: "Some notes.",
                        submittedAt: Date.now(),
                        userName: "rahul"
                    },
                    approved: null,
                    notes: null
                },
                {
                    id: 652,
                    reviewerId: 75,
                    submissionObject: {
                        files: [
                            "http://cloud.google.com/randId1_some_filename.html",
                            "http://cloud.google.com/randId1_some_more.css",
                            "http://cloud.google.com/randId1_evenmore.js"
                        ],
                        notes: "Some notes.",
                        submittedAt: Date.now(),
                        userName: "dhannu"
                    },
                    approved: null,
                    notes: null
                },
                {
                    id: 897,
                    reviewerId: 75,
                    submissionObject: {
                        files: [
                            "http://cloud.google.com/randId1_some_filename.html",
                            "http://cloud.google.com/randId1_some_more.css",
                            "http://cloud.google.com/randId1_evenmore.js"
                        ],
                        notes: "Some notes.",
                        submittedAt: Date.now(),
                        userId: 1242
                    },
                    approved: true,
                    notes: "EKdum mast banaya"
                }
            ]
        });
    }
    editPeerReviewRequest(request, reply) {
        return reply({
            id: 471,
            reviewerId: 75,
            submissionId: 12,
            approved: true,
            notes: "Jaldi kar dio bhai!!"
        });
    }
}
exports.default = AssignmentController;
//# sourceMappingURL=assignment-controller.js.map