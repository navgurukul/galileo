// const requests = require("request");
// import * as CustomRequest from "request";

// import * as Configs from "./configurations";

// interface Details {
//     receiverId: string;
//     message: string;

// }

// const cliqConfigs=Configs.getCliqConfig();

// export const sendCliqIntimation = (details: Details) => {
//     // Email template

//     return new Promise(function (resolve, reject) {

//         let cliqBaseApiUrl = "https://cliq.zoho.com/api/v2/buddies";
//         let email = details.receiverId;
//         let authToken = cliqConfigs.authtoken;

//         let sendMessageToCliqUrl = `${cliqBaseApiUrl}/${email}/message?authtoken=${authToken}`

//         CustomRequest.post(sendMessageToCliqUrl , {
//             json: {
//                 text: `${details.message}`
//             }
//         }, function (error, response, body) {

//             if (!error && response.statusCode == 204) {

                
//                 return resolve(response.statusCode);
//                 //
//             } else {
                
//                 return resolve(body);
//             }
//         })
//     });
// };