"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Joi = require("joi");
exports.exerciseSubmissionPayload = Joi.object({
    manualDone: Joi.bool(),
    files: Joi.array().items(Joi.string().uri())
        .description("List of URLs of submitted files"),
    notes: Joi.string(),
    userId: Joi.number()
        .description("ID of the user who made the submission.")
}).without('manualDone', ['files', 'notes']);
exports.exerciseSubmission = exports.exerciseSubmissionPayload.keys({
    id: Joi.number(),
    submittedAt: Joi.date().timestamp()
});
exports.peerReview = Joi.object({
    id: Joi.number(),
    reviewerId: Joi.number(),
    submissionId: Joi.number(),
    approved: Joi.bool(),
    notes: Joi.string()
});
//# sourceMappingURL=schemas.js.map