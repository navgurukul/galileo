"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showErrorAndExit = exports.updateContentWithImageLinks = exports.generateUID = void 0;
const colors = require("colors");
const process = require("process");
// Helper function to generate UIDs
function generateUID() {
    // I generate the UID from two parts here
    // to ensure the random number provide enough bits.
    let firstPart = ((Math.random() * 46656) | 0).toString(36);
    let secondPart = ((Math.random() * 46656) | 0).toString(36);
    firstPart = ("000" + firstPart).slice(-3);
    secondPart = ("000" + secondPart).slice(-3);
    return firstPart + secondPart;
}
exports.generateUID = generateUID;
function updateContentWithImageLinks(images, content) {
    let updateContent = content;
    images.forEach(image => {
        // TODO need o be updated from gcloud tto amazon
        updateContent = updateContent.replace(image.relativePath, image.gcsLink);
    });
    return updateContent;
}
exports.updateContentWithImageLinks = updateContentWithImageLinks;
exports.showErrorAndExit = function (message) {
    console.log(colors.red.bold(message));
    console.log(colors.red("Fix the above error and re-run this script."));
    process.exit();
};
//# sourceMappingURL=utils.js.map