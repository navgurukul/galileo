/* Replace with your SQL commands */
ALTER TABLE `course_relation` ADD KEY `course_relation_ibfk_1` (`courseId`);

ALTER TABLE `course_relation` 
ADD CONSTRAINT `course_relation_ibfk_1` 
FOREIGN KEY (`courseId`) 
REFERENCES `courses` (`id`) 
ON DELETE NO ACTION ON UPDATE NO ACTION;


ALTER TABLE `course_relation` ADD KEY `course_relation_ibfk_2` (`reliesOn`);

ALTER TABLE `course_relation` 
ADD CONSTRAINT `course_relation_ibfk_2` 
FOREIGN KEY (`reliesOn`) 
REFERENCES `courses` (`id`) 
ON DELETE NO ACTION ON UPDATE NO ACTION;