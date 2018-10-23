
declare var require: any;
declare var module: any;

import * as colors from "colors";
import * as process from 'process';


// Helper function to generate UIDs
export function generateUID():string {
    // I generate the UID from two parts here
    // to ensure the random number provide enough bits.
    let firstPart = ((Math.random() * 46656) | 0).toString(36);
    let secondPart = ((Math.random() * 46656) | 0).toString(36);
    firstPart = ("000" + firstPart).slice(-3);
    secondPart = ("000" + secondPart).slice(-3);
    return firstPart + secondPart;
}

export function updateContentWithImageLinks(images: any[], content: string): string {
    let updateContent = content;

    images.forEach(image => {
        // TODO need o be updated from gcloud tto amazon
        updateContent = updateContent.replace(image.relativePath, image.gcsLink);
    });

    return updateContent;
}

export const showErrorAndExit = function(message:string) {
    console.log( colors.red.bold(message) );
    console.log( colors.red("Fix the above error and re-run this script.") );
    process.exit();
};
