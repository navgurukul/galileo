const Joi = require('joi');
const ObjectionUnique  = require('objection-unique');
const Model  = require('./extenstions/index');
const User  = require('./user');

const withUniqueValidation = ObjectionUnique({
  fields: ['menteeId'],
  identifiers: ['id'],
});


module.exports =  class MentorTree extends withUniqueValidation(Model) {
  static get tableName() {
    return 'mentor_tree';
  }

  static get joiSchema() {
    return Joi.object({
      id: Model.idSchema,
      mentorId: Model.idSchema.required(),
      menteeId: Model.idSchema.required(),
      createdAt: Joi.date(),
      updatedAt: Joi.date(),
    });
  }

  static get relationMappings() {
    return {};
  }

  async $beforeInsert(ctx) {
    await super.$beforeInsert(ctx);
    this.createdAt = new Date();
  }

  async $beforeUpdate(queryOptions, ctx) {
    await super.$beforeUpdate(queryOptions, ctx);
    this.updatedAt = new Date();
  }
}
