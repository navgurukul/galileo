const Joi = require('joi');
const Model  = require('./extenstions/index');
const User  = require('./user');
const Exercise  = require('./exercise');

module.exports =  class AssignmentSubmission extends Model {
  static get tableName() {
    return 'assignment_submissions';
  }

  static get joiSchema() {
    return Joi.object({
      id: Model.idSchema,
      exerciseId: Model.idSchema.required(),
      submitterId: Model.idSchema.required(),
      createdAt: Joi.date(),
      updatedAt: Joi.date(),
      submitterNotes: Joi.string().required(),
      reviewerId: Model.idSchema,
      reviewerNotes: Joi.string(),
      reviewedAt: Joi.date(),
      state: Joi.string().valid(['completed', 'pending', 'rejected']),
      completedAt: Joi.date(),
    });
  }

  static get relationMappings() {
    return {
      exercise: {
        relation: Model.BelongsToOneRelation,
        modelClass: Exercise,
        join: {
          from: this.foreignKeyChain('exerciseId'),
          to: Exercise.foreignKeyChain('id'),
        },
      },
      submitter: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: this.foreignKeyChain('submitterId'),
          to: User.foreignKeyChain('id'),
        },
      },
      reviewer: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: this.foreignKeyChain('reviewerId'),
          to: User.foreignKeyChain('id'),
        },
      },
    };
  }

  $beforeInsert() {
    this.createdAt = new Date();
  }

  $beforeUpdate() {
    this.updatedAt = new Date();
  }
}
