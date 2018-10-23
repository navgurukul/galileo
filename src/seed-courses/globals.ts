// Globals
var courseDir, // Path of the course directory relative to this file
    courseData = {}, // Course data which will be put into the DB eventually
    exercises = [], // All exercises
    allSlugs = [], // All slugs will be stored here
    sequenceNumbers = {},
    revSeqNumbers = {},
    toReadFiles = [],
    courseId;

export {
  courseDir,
  courseData,
  exercises,
  allSlugs,
  sequenceNumbers,
  revSeqNumbers,
  toReadFiles,
  courseId
}
