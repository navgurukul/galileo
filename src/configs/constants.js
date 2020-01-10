const _ = require('underscore');

const constants = {
  reviewType: [
    'automatic',
    'peer',
    'facilitator',
    'manual',
  ],
  submissionType: [
    'number',
    'shortText',
    'largeText',
    'url',
  ],
  courseEnrollStatus: [
    'enroll',
    'complete',
    'unenroll',
  ],
};

function withReadOnly(obj) {
  const newObj = {};
  _.forEach(_.keys(obj), (key) => {
    let value = obj[key];
    if (value instanceof Object && !Array.isArray(value)) {
      value = withReadOnly(value);
    }
    Object.defineProperty(newObj, key, {
      value,
      writable: false,
    });
  });
  return newObj;
}

module.exports =  withReadOnly(constants);
