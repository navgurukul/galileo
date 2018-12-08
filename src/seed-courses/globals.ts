// Globals
var courseDir, // Path of the course directory relative to this file
    courseData = {}, // Course data which will be put into the DB eventually
    exercises = [], // All exercises
    allSlugs = [], // All slugs will be stored here
    sequenceNumbers = {},
    revSeqNumbers = {},
    toReadFiles = [],
    courseId,
    defaultCourseLogo = "http://navgurukul.org/img/sqlogo.jpg",
    defaultFacilators = ["amar17@navgurukul.org", 'a@navgurukul.org'];

export {
  courseDir,
  courseData,
  exercises,
  allSlugs,
  sequenceNumbers,
  revSeqNumbers,
  toReadFiles,
  courseId,
  defaultFacilators,
}
