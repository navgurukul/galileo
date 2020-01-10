const Joi = require('joi');
const Model  = require('./extenstions/index');

module.exports =  class CourseRelation extends Model {
  static get tableName() {
    return 'course_relations';
  }

  static get joiSchema() {
    return Joi.object({
      id: Model.idSchema,
      courseId: Model.idSchema.required(),
      dependencyCourseId: Model.idSchema.required(),
      createdAt: Joi.date(),
      updatedAt: Joi.date(),
    });
  }

  static get relationMappings() {
    return {};
  }

  $beforeInsert() {
    const now = new Date();
    this.createdAt = now;
  }

  $beforeUpdate() {
    const now = new Date();
    this.updatedAt = now;
  }
};
