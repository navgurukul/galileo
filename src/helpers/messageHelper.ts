var _ = require("underscore");
import * as Configs from "../configurations";
import database from "../";

export const getforIndivisualTimePeriod = function (details) {

  let str=` Hi , ${details.name} Iss test ko dene ke liye aap jald hi, yeh website - http://join.navgurukul.org/k/<%= it.key; %> kholein aur test ko de. Test dene ke liye aap apne paas ek notebook aur pen tayyar rakhe, aur apne answers ko apne phone mei hi answer karein.`

return str;


};

export const getNumberOfAssignmentSubmittedPerUser = function () {
   

};


export const sendAssignmentReviewPendingEmail = () => {
    // Email template
  
    };
  

  
  
  export const sendAssignmentReviewCompleteEmail = () => {
    
   
  };
  
  export const sendCoursesUnlockedForUserEmail = () => {
  
  };
  
  export const sendSubmissionReport = () => {
    
   
  };


