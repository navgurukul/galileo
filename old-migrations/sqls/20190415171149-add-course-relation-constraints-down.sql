/* Replace with your SQL commands */
ALTER TABLE `course_relation` DROP FOREIGN KEY `course_relation_ibfk_1`;
ALTER TABLE `course_relation` DROP INDEX `course_relation_ibfk_1`;

ALTER TABLE `course_relation` DROP FOREIGN KEY `course_relation_ibfk_2`;
ALTER TABLE `course_relation` DROP INDEX `course_relation_ibfk_2`;
