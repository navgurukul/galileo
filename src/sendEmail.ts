var AWS = require('aws-sdk');
// Set the region


const sendEmail = (receiverEmails:Array<string>, htmlTemplate:string, subject:string,
      emailText:string, CcEmails: Array<string>, awsConfig) => {

      AWS.config.update({
        region: "us-east-1",
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
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

interface User{
  name: string;
  email: string;
};

export const sendAssignmentReviewEmail = (student:User, reviewer:User, awsConfig) => {
    // Email template
    let reviewerHtmlTemplate = `
      <div>
        <h5>
            Hi ${reviewer.name}, Apke pass ${student.name} ka assignment aya hai.<br />
            Ushe app review karle. <br />
            <a target="_blank" href="http://saral.navgurukul.org/assignment-review">Link</a>
            <br/> <br/>
            Hello ${student.name}, ${reviewer.name} apka assignment review kardenge,<br />
            warna app ushe yahi pe remind karwa sakte ho.
        </h5>
      </div>
    `;



    let subject = "Assignment Review Details.";

    let emailText = ("\r\n");

    // send email to reviewer
    let reviewerEmailPromise = sendEmail([reviewer.email], reviewerHtmlTemplate, subject, emailText, [student.email], awsConfig);

    return reviewerEmailPromise.then(() => {
      return Promise.resolve();
    });

};
