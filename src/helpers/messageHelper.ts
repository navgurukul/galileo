var _ = require("underscore");
import * as Configs from "../configurations";
import database from "../";
import { strict } from "assert";


/**
 * 
 * @param args 
 */
export const newPeerReviewRequest = function (args) {
  return `Hi ${args.reviewerName} apke pass ${args.submitterName} ka assignment aya hai app ishe yahan review karwasakte hai.`;
};

/**
 * 
 * @param args 
 */
export const assignmentApproved = (args) => {
  let str = `Hi ${args.submitterName} apka assignment ${args.reviewerName} ne approve kardiya ha app ushe yahan dekh sakte ho`;
  str = str + ` http://saral.navgurukul.org/course?id=${args.courseId}&slug=${args.exercieseSlug}`;
  return str;
};

/**
 * 
 * @param args 
 */
export const assignmentRejected = (args) => {
  let str = `Hi ${args.submitterName} apka assignment ${args.reviewerName} ne reject kardiya ha app unke diye gaye feedback par kaam karke phirse assignment submit karsakte ho`;
  str = str + ` Apke assignment ka link`;
  str = str + ` http://saral.navgurukul.org/course?id=${args.courseId}&slug=${args.exercieseSlug}`;
  return str;
};


export const courseDependencyUnlocked = (args) => {
  let str = `Congrats, Apne yeh course ${args.percent} complete karlia hai isliye apke liye  naye courses unlock hogye`;

  args.courseDetails.map(( value,key ) => {
    str = str + `Course ${key} (Url - http://saral.navgurukul.org/course?id=${value.courseId})`
  })


  return str;

};

/**
 * 
 * @param args 
 */
export const courseMarkedCompletedManual = (args) => {
  return `Congrats, Apka course ${args.courseName} apke mentor ${args.mentor} ne complete mark kardiya ab aap aage ke courses karsakte hai.`;

};
export const courseMarkedCompletedAutomatic = (args) => {
  return `Hi, congrats you have completed the course here and now there are more courses have been unlocked.`;

};

export const newCourseAdded = (args) => {
  let str = `Hi ${args.studentName}, humne SARAL pe naye courses launch kia inh courses ko niche diye gaye link pe click karke dekh sakte ho.`;
  console.log("args.courseDetails",args.courseDetails)
  args.courseDetails.map((value,key) => {

   
    str = str + ` Course ${key} (Url - http://saral.navgurukul.org/course?id=${value.courseId})`
  })

  return str;
};

export const courseChangesConceptAdded = (args) => {
  let str = `Hi ${args.studentName},`;
  str = str + `${args.exerciseDetails.courseName} course me kuch naye topic add hue hai aap ushe yahan click karke dekh sakte ha.`;
  // args.exerciseDetails.map(( value) => {
  //   str = str + ` ${value.exerciseName} (Url - http://saral.navgurukul.org/course?id=${value.courseId}&slug=${value.exercieseSlug})`
  // })
  
    str = str + ` ${args.exerciseDetails.name} (Url - http://saral.navgurukul.org/course?id=${args.exerciseDetails.courseId}&slug=${args.exerciseDetails.slug})`
  
  return str;
};

export const courseChangesConceptChanged = (args) => {
  let str = `Hi ${args.studentName},`;
  str = str + `Aur kuch purane topics me changes hue hai joh niche diye gaye hai.`;
  // args.exerciseDetails.map(( value) => {
  //   str = str + ` ${value.exerciseName} (Url - http://saral.navgurukul.org/course?id=${value.courseId}&slug=${value.exercieseSlug})`
  // })
  str = str + ` ${args.exerciseDetails.name} (Url - http://saral.navgurukul.org/course?id=${args.exerciseDetails.courseId}&slug=${args.exerciseDetails.slug})`
  
  return str;

};





