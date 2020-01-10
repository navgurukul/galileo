const Joi = require('joi');
const Model  = require('./extenstions/index');
const constants  = require('../configs/constants');
const Course  = require('./course');

module.exports =  class CourseEnrollment extends Model {
  static get tableName() {
    return 'course_enrollments';
  }

  static get joiSchema() {
    return Joi.object({
      id: Model.idSchema,
      courseId: Model.idSchema.required(),
      studentId: Model.idSchema.required(),
      createdAt: Joi.date(),
      courseStatus: Model.stringEnums(constants.courseEnrollStatus)
        .default('enroll'),
      completedAt: Joi.date(),
      updatedAt: Joi.date(),
    });
  }

  static get relationMappings() {
    return {
      course: {
        relation: Model.BelongsToOneRelation,
        modelClass: Course,
        join: {
          from: this.foreignKeyChain('courseId'),
          to: Course.foreignKeyChain('id'),
        },
      }
    };
  }

  $beforeInsert() {
    this.createdAt = new Date();
  }

  $beforeUpdate() {
    this.updatedAt = new Date();
  }
}
