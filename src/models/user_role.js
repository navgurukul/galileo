const Joi = require('joi');
const Model  = require('./extenstions/index');
const Role = require('./role');
const Center = require('./center');
const User  = require('./user');

module.exports =  class UserRole extends Model {
  static get tableName() {
    return 'user_roles';
  }

  static get joiSchema() {
    return Joi.object({
      id: Model.idSchema,
      userId: Model.idSchema.required(),
      roleId: Model.idSchema.required(),
      createdAt: Joi.date(),
      updatedAt: Joi.date(),
      centerId: Model.idSchema.required(),
    });
  }

  static get relationMappings() {
    return {
      role: {
        relation: Model.BelongsToOneRelation,
        modelClass: Role,
        join: {
          from: this.foreignKeyChain('id'),
          to: Role.foreignKeyChain('id'),
        },
      },
      center: {
        relation: Model.BelongsToOneRelation,
        modelClass: Center,
        join: {
          from: this.foreignKeyChain('centerId'),
          to: Center.foreignKeyChain('id'),
        },
      },
    };
  }

  $beforeInsert(ctx) {
    const now = new Date();
    this.createdAt = now;
  }

  $beforeUpdate(queryOptions, ctx) {
    const now = new Date();
    this.updatedAt = now;
  }
}
