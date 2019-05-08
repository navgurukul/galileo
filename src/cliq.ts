// const requests = require("request");
import * as CustomRequest from "request";

import * as Configs from "./configurations";

import * as ejs from "ejs";
import * as messageHelper from "./helpers/messageHelper";

interface Details {
    receiverId: string;
    message: string;

}

const cliqConfigs = Configs.getCliqConfig();

export const sendCliqIntimation = (details: Details) => {

    return new Promise(function (resolve, reject) {

        CustomRequest.post(`https://cliq.zoho.com/api/v2/buddies/${details.receiverId}/message?authtoken=${cliqConfigs.authtoken}`, {
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


export const sendCliqIntimationTest = (filename, data) => {
    // Email template

    return new Promise(function (resolve, reject) {


      
        var filePath = "img/avatar/";

        ejs.renderFile(filePath + filename, { data: data }, {async:true}, function (err, str) {
            console.log("what i am getting :", str);

            CustomRequest.post(`https://cliq.zoho.com/api/v2/buddies/${data.receiverId}/message?authtoken=${cliqConfigs.authtoken}`, {
                json: {
                    text: `${str}`
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





            // str => Rendered HTML string
        });

       








    });
}


export const sendCliqIntimationMessagetest = (functionname, details) => {
    // Email template

    return new Promise(function (resolve, reject) { 
      
      
     // console.log(messageHelper["getforIndivisualTimePeriod"]());
     console.log("Message is goint to sent===>",messageHelper[`${functionname}`](details.messageArgs),"------");

       
 
        // CustomRequest.post(`https://cliq.zoho.com/api/v2/buddies/${details.receiverEmail}/message?authtoken=${cliqConfigs.authtoken}`, {
        //     json: {
        //         text: messageHelper[`${functionname}`](details.messageArgs)
        //     }
        // }, function (error, response, body) {



        //     if (!error && response.statusCode == 204) {

        //         console.log('message sent successsfully')
        //         return resolve(response.statusCode);
        //         //console.log(body) // Show the HTML for the Google homepage.
        //     } else {
        //         console.log(body);
        //         return resolve(body);
        //     }


        // })
    });
}