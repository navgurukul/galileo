// Globals
let courseDir; // Path of the course directory relative to this file
const courseData = {}; // Course data which will be put into the DB eventually
const exercises = []; // All exercises
const allSlugs = []; // All slugs will be stored here
const sequenceNumbers = {};
const revSeqNumbers = {};
const toReadFiles = [];
let courseId;
const defaultCourseLogo = 'http://navgurukul.org/img/sqlogo.jpg';

export {
  courseDir,
  courseData,
  exercises,
  allSlugs,
  sequenceNumbers,
  revSeqNumbers,
  toReadFiles,
  courseId,
  defaultCourseLogo,
};
