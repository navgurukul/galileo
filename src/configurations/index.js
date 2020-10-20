"use strict";
// import * as nconf from "nconf";
// import * as path from "path";
// error logging using sentry.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSentryConfig = exports.getScheduleConfigs = exports.getCourseConfigs = exports.getServerConfigs = exports.getDatabaseConfig = exports.checkConfigEnvironment = void 0;
const Sentry = require('@sentry/node');
const configs = require("../constant");
// export interface CliqConfigurations {
//     authtoken:  string;
// }
function checkConfigEnvironment() {
    if (!!configs["database"] === false) {
        console.error('Check GALILEO_ENV variable');
        process.exit();
    }
}
exports.checkConfigEnvironment = checkConfigEnvironment;
function getDatabaseConfig() {
    checkConfigEnvironment();
    //
    return configs["database"];
}
exports.getDatabaseConfig = getDatabaseConfig;
function getServerConfigs() {
    checkConfigEnvironment();
    return configs["server"];
}
exports.getServerConfigs = getServerConfigs;
function getCourseConfigs() {
    checkConfigEnvironment();
    return configs["courseConfig"];
}
exports.getCourseConfigs = getCourseConfigs;
function getScheduleConfigs() {
    checkConfigEnvironment();
    return configs["scheduleConfigs"];
}
exports.getScheduleConfigs = getScheduleConfigs;
function getSentryConfig() {
    checkConfigEnvironment();
    let sentryConfig = configs["sentryConfig"];
    Sentry.init({ dsn: sentryConfig.sentryDsn });
    return Sentry;
}
exports.getSentryConfig = getSentryConfig;
// export function getCliqConfig():CliqConfigurations{
//     checkConfigEnvironment()
//     return configs["cliqConfig"]
// }
//# sourceMappingURL=index.js.map