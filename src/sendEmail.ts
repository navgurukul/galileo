var AWS = require('aws-sdk');
// Set the region
import * as Configs from "./configurations";
let serverConfigs = Configs.getServerConfigs();

let baseUrl = process.env.GALILEO_ENV === 'dev'?
              "http://localhost:3000":"http://saral.navgurukul.org";

const sendEmail = (receiverEmails:Array<string>, htmlTemplate:string, subject:string,
      emailText:string, CcEmails: Array<string>) => {

      AWS.config.update({
        region: "us-east-1",
        accessKeyId: serverConfigs.awsEmailConfig.accessKeyId,
        secretAccessKey: serverConfigs.awsEmailConfig.secretAccessKey,
      });

      let SENDER = "SARAL <saral@navgurukul.org>";

      let params = {
        Destination: { /* required */
          CcAddresses: CcEmails,
          ToAddresses: receiverEmails,
        },
        Message: { /* required */
          Body: { /* required */
            Html: {
             Charset: "UTF-8",
             Data: htmlTemplate
            },
            Text: {
             Charset: "UTF-8",
             Data: emailText
            }
           },
           Subject: {
            Charset: 'UTF-8',
            Data: subject
           }
          },
        Source: SENDER, /* required */
      };

      // Create the promise and SES service object
      let sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(params).promise();

      // Handle promise's fulfilled/rejected states
      return sendPromise.then(function(data) {
          console.log(data.MessageId);
          return Promise.resolve();
      })
      .catch(function(err) {
          console.error(err, err.stack);
          return Promise.reject();
      });
};

interface User {
  name: string;
  email: string;
};

interface SubmissionDetail {
  submissionId: number;
  exerciseName: string;
  exerciseSlug: string;
  completed: boolean;
  state: string;
}

interface ExerciseDetail {
  courseId: number;
  slug: string;
  name: string;
}

export const sendAssignmentReviewPendingEmail = (student:User, reviewer:User, submissionDetail: SubmissionDetail) => {
    // Email template
    let emailTemplate = `
      <div>
        <h5>
          Hi ${reviewer.name}, Apke pass ${student.name} ka assignment aya hai.<br />
          Ushe app review karle. <br />
          <a
            target="_blank"
            href="${baseUrl}/assignment-review?submissionId=${submissionDetail.submissionId}">
              Link
          </a>
          <br/> <br/>
          Hello ${student.name}, ${reviewer.name} apka assignment review kardenge,<br />
          warna app ushe yahi pe remind karwa sakte ho.
        </h5>
      </div>
      `;
    let subject = `Assignment Review for ${submissionDetail.exerciseName} of ${student.name}.`;

    let emailText = ("\r\n");

    // send email to reviewer
    let emailPromise = sendEmail([reviewer.email], emailTemplate, subject, emailText, [student.email]);
    return emailPromise.then(() => {
        return Promise.resolve();
    });

};


export const sendAssignmentReviewCompleteEmail = (student:User, reviewer:User, exerciseDetail: ExerciseDetail) => {
    let emailTemplate = `
      <div>
        <h5>
          Hi ${student.name}, Apka assignment check hogya ha. <br />
          Aap apna assignment ka feedback
          <a href="${baseUrl}/course?id=${exerciseDetail.courseId}&slug=${exerciseDetail.slug}">
            yahan
          </a>
          dekh sakte ho.
        </h5>
      </div>
    `;
    let subject = `Assignment Review for ${exerciseDetail.name} of ${student.name}.`;
    let emailText = ("\r\n");

    // send email to reviewer
    let emailPromise = sendEmail([student.email], emailTemplate, subject, emailText, []);

    return emailPromise.then(() => {
        return Promise.resolve();
    });
};
