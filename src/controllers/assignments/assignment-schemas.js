"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postSubmission = exports.peerReviewSubmission = exports.exerciseSubmission = void 0;
const Joi = require("joi");
exports.exerciseSubmission = Joi.object({
    id: Joi.number(),
    exercise_id: Joi.number(),
    user_id: Joi.number(),
    submitted_at: Joi.date(),
    submitter_notes: Joi.string().allow(null),
    files: Joi.array().items(Joi.string().uri()).allow(null),
    notes_reviewer: Joi.string().allow(null),
    state: Joi.string(),
    completed: Joi.bool(),
    completed_at: Joi.date().allow(null),
    // Reviewer Details
    reviewerName: Joi.string().allow(null),
    reviewerId: Joi.number().allow(null),
    reviewerProfilePicture: Joi.string().uri().allow(null),
    // isReviewerFacilitator: Joi.bool().allow(null),
    // Submitter Details
    submitterName: Joi.string(),
    submitterId: Joi.number(),
    submitterProfilePicture: Joi.string().uri(),
});
exports.peerReviewSubmission = exports.exerciseSubmission.keys({
    exerciseContent: Joi.string(),
    parent_exercise_id: Joi.number().allow(null),
    course_id: Joi.number(),
    exerciseName: Joi.string(),
    exerciseSlug: Joi.string(),
    exerciseSequenceNum: Joi.number(),
    review_type: Joi.string(),
});
exports.postSubmission = exports.exerciseSubmission.keys({
    submissionId: Joi.number(),
    exerciseName: Joi.string(),
    exerciseSlug: Joi.string(),
    completed: Joi.bool(),
    state: Joi.string(),
});
//# sourceMappingURL=assignment-schemas.js.map