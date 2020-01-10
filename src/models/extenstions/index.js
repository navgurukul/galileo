const Joi = require('joi');
const Schwifty = require('schwifty');
const { DbErrors } = require('objection-db-errors');
const _ = require('underscore');

module.exports = class Model extends DbErrors(Schwifty.Model) {
  static createNotFoundError(ctx) {
    const error = super.createNotFoundError(ctx);

    return Object.assign(error, {
      modelName: this.name,
    });
  }

  static field(name) {
    return Joi.reach(this.getJoiSchema(), name)
      .optional()
      .options({ noDefaults: true });
  }

  static foreignKeyChain(name) {
    if (!this.fields().includes(name)) {
      throw Error(`${name} is not in the ${this.name} model"`);
    }
    return `${this.tableName}.${name}`;
  }

  static fields() {
    return _.keys(this.getJoiSchema().describe().children);
  }

  static get idSchema() {
    return Joi.number().integer().greater(0);
  }

  static get uriSchema() {
    return Joi.string().uri();
  }

  static stringEnums(enums) {
    return Joi.string().valid(enums);
  }

  static integerEnums(enums) {
    return Joi.number().valid(enums);
  }
};
