declare var require: any;
declare var module: any;

import * as fs from "fs-extra";
import { generateUID } from "./utils";
var globals = require("./globals");

// Given the markdown of imageTextan image this returns the path of the image on Google Cloud Storage
export function parseAndUploadImage(
    imageText: string,
    sequenceNum: string,
    path: string,
    iIndex,
    jIndex?
) {
    // get relative image path and image name
    let temp1 = imageText.split("]")[1];
    let imagePath = temp1.slice(1, -1);
    let temp3 = imagePath.split("/");
    let imageName = temp3[temp3.length - 1];

    // remove exercise name from path
    let temp2 = path.split("/");
    temp2.pop();

    // use relative path and path in temp2 get the complete path relative to seed-courses.ts
    let semiPath = temp2.join("/");
    let completePath = semiPath + "/" + imagePath;

    var AWS = require("aws-sdk");
    var s3 = new AWS.S3();
    var myBucket = "saralng";

    // let localReadStream = fs.createReadStream(completePath);
    let dir = globals.courseData["info"]["name"] + "/" + sequenceNum;
    let name = generateUID() + "." + imageName;
    let filePath = dir + "/" + name;
    filePath = filePath.replace(/ /g, "__");

    return new Promise((resolve, reject) => {
        fs.readFile(completePath, function(err, data) {
            if (err) {
                return console.log(err);
            }

            let extn = completePath.split(".").pop();
            let contentType = "application/octet-stream";
            if (extn === "html") {
                contentType = "text/html";
            } else if (extn === "css") {
                contentType = "text/css";
            } else if (extn === "js") {
                contentType = "application/javascript";
            } else if (extn === "png" || extn === "jpg" || extn === "gif") {
                contentType = "image/" + extn;
            }

            var params = {
                Bucket: myBucket,
                Key: filePath,
                Body: data,
                ContentType: contentType
            };
            s3.upload(params, function(err, data) {
                if (err) {
                    
                } else {
                    return resolve({
                        relativePath: imagePath,
                        gcsLink:
                            "https://s3.ap-south-1.amazonaws.com/saralng/" +
                            filePath,
                        imageMD: imageText,
                        iIndex: iIndex,
                        jIndex: jIndex
                    });
                }
            });
        });
    });
}
