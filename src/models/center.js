const Joi = require('joi');

const ObjectionUnique  = require('objection-unique');
const Model  = require('./extenstions/index');

const withUniqueValidation = ObjectionUnique({
  fields: ['name'],
  identifiers: ['id'],
});

module.exports =  class Center extends withUniqueValidation(Model) {
  static get tableName() {
    return 'centers';
  }

  static get joiSchema() {
    return Joi.object({
      id: Model.idSchema,
      name: Joi.string().required(),
      createdAt: Joi.date(),
      updatedAt: Joi.date(),
    });
  }

  static get relationMappings() {
    return {};
  }

  async $beforeInsert(ctx) {
    await super.$beforeInsert(ctx);
    const now = new Date();
    this.createdAt = now;
  }

  async $beforeUpdate(queryOptions, ctx) {
    await super.$beforeUpdate(queryOptions, ctx);
    const now = new Date();
    this.updatedAt = now;
  }
}
