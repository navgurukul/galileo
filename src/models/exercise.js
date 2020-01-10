const Joi = require('joi');
const Model  = require('./extenstions/index');
const constants  = require('../configs/constants');

module.exports =  class Exercise extends Model {
  static get tableName() {
    return 'exercises';
  }

  static get joiSchema() {
    return Joi.object({
      id: Model.idSchema,
      parentExerciseId: Model.idSchema,
      courseId: Model.idSchema,
      name: Joi.string().required(),
      slug: Joi.string().required(),
      sequenceNum: Joi.number().required(),
      reviewType: Model.stringEnums(constants.reviewType)
        .default('automatic'),
      content: Joi.string(),
      solution: Joi.string(),
      submissionType: Model.stringEnums(constants.submissionType).required(),
      githubUrl: Model.uriSchema, // Add custom Joi for github
      createdAt: Joi.date(),
      updatedAt: Joi.date(),
    });
  }

  static get relationMappings() {
    return {
      parentExercise: {
        relation: Model.BelongsToOneRelation,
        modelClass: Exercise,
        join: {
          from: this.foreignKeyChain('id'),
          to: this.foreignKeyChain('parentExerciseId'),
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
