"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Mongoose = require("mongoose");
;
exports.TaskSchema = new Mongoose.Schema({
    userId: { type: String, required: true },
    name: { type: String, required: true },
    description: String,
    completed: Boolean
}, {
    timestamps: true
});
exports.TaskModel = Mongoose.model('Task', exports.TaskSchema);
//# sourceMappingURL=task.js.map