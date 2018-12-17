var AWS = require('aws-sdk');
// Set the region
AWS.config.update({region: 'REGION'});



const sendEmail = (receiverEmails:<Array>, htmlTemplate:<String>, subject:<String>, emailText:<String>, CcEmails: <Array>) => {
      let SENDER = "SARAL <saral@navgurukul.org>"
      AWS.config.update({region: "us-east-1"});

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
}


export const sendAssignmentReviewEmail = (student, reviwer) => {
    // student Email template
    let studentHtmlTemplate = `
      <div>
        <h3>
            Hi ${reviwer.name}, Apke pass ${student.name} ka assignment aya hai. Ushe check karle.
        </h3>
      </div>
    `;

    // reviwer Email template
    let reviewerHtmlTemplate = `
      <div>
        <h3>
            Hi ${student.name}, Apka Assignment ${reviwer.name} ke pass &nbsp;
            jama kiya gaya ha review ke liye, Jinka email address ${reviwer.email} hai.
        </h3>
      </div>
    `;

    let subject = "Assignment Review Details.";

    let emailText = ("\r\n");

    // send email to reviewer
    let reviewerEmailPromise = sendEmail([reviwer.email], reviewerHtmlTemplate, subject, emailText, []);
    //send email to the student
    let studentEmailPromise = sendEmail([student.email], studentHtmlTemplate, subject, emailText, []);
    return Promise.all([reviewerEmailPromise,studentEmailPromise]).then(() => {
        console.log("done");
        return Promsie.resolve();
    })
}
