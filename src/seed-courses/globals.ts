// Globals
var courseDir, // Path of the course directory relative to this file
    courseData = {}, // Course data which will be put into the DB eventually
    exercises = [], // All exercises
    allSlugs = [], // All slugs will be stored here
    sequence_numbers = {},
    revSeqNumbers = {},
    toReadFiles = [],
    course_id,
    multi_languge = ["hi", "en", "te", "ta"],
    defaultCourseLogo = "http://navgurukul.org/img/sqlogo.jpg";

export {
  courseDir,
  courseData,
  exercises,
  allSlugs,
  sequence_numbers,
  revSeqNumbers,
  toReadFiles,
  course_id,
  multi_languge,
  defaultCourseLogo
}
