// const requests = require("request");
import * as CustomRequest from "request";

import * as Configs from "./configurations";

interface Details {
    receiverEmail: string;
    message: string;

}

const cliqConfigs=Configs.getCliqConfig();

export const sendCliqIntimation = (details: Details) => {
    // Email template

    return new Promise(function (resolve, reject) {
    
        CustomRequest.post(`https://cliq.zoho.com/api/v2/buddies/${details.receiverEmail}/message?authtoken=${cliqConfigs.authtoken}`, {
            json: {
                text: `${details.message}`
            }
        }, function (error, response, body) {

           

            if (!error && response.statusCode == 204) {

                console.log('message sent successsfully')
                return resolve(response.statusCode);
                //console.log(body) // Show the HTML for the Google homepage.
            } else {
                console.log(body);
                return resolve(body);
            }





        })
    });



};