/* Replace with your SQL commands */
ALTER TABLE `davinci`.`users` 
ADD COLUMN `githubLink` VARCHAR(145) NULL AFTER `center`,
ADD COLUMN `linkedinLink` VARCHAR(145) NULL AFTER `githubLink`,
ADD COLUMN `mediumLink` VARCHAR(145) NULL AFTER `linkedinLink`;
