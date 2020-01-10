/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */
const color = require('colors');
const _ = require('underscore');
const Sentry = require('@sentry/node');

const readOnlyConstants = require('./constants');
const secretConfig = require('./config');

class Configurations {
  constructor(configs, constants) {
    this._configs = configs;
    this._constants = constants;
    if (!this._configs) {
      console.error(color.red('Check GALILEO_ENV variable'));
      throw new Error('Check GALILEO_ENV variable');
    }
  }

  getDatabaseConfig() {
    function isTypeTinyIntAndOfLengthOne(field) {
      return field.type === 'TINY' && field.length === 1;
    }
    function turnIntoBooleanIfNotNull(value) {
      return value !== null ? (value === '1') : null;
    }

    const dbConfigs = this._configs.database;
    const updatedDbConfigs = _.extend({}, dbConfigs);
    updatedDbConfigs.connection.typeCast = (field, next) => {
      if (isTypeTinyIntAndOfLengthOne(field)) {
        const value = field.string();
        return turnIntoBooleanIfNotNull(value);
      }
      return next();
    };
    return updatedDbConfigs;
  }

  getServerConfigs() {
    return this._configs.server;
  }

  getCourseConfigs() {
    return this._configs.courseConfig;
  }

  getScheduleConfigs() {
    return this._configs.scheduleConfig;
  }

  getSentryConfig() {
    const { sentryConfig } = this._configs;
    Sentry.init({ dsn: sentryConfig.sentryDsn });
    return Sentry;
  }

  getCliqConfig() {
    return this._configs.cliqConfig;
  }

  getConstant(key) {
    return this._constants[key] || null;
  }
}

module.exports = new Configurations(secretConfig, readOnlyConstants);
