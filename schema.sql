-- MySQL dump 10.13  Distrib 8.0.17, for Linux (x86_64)
--
-- Host: hisaab.cosodeda78lq.ap-south-1.rds.amazonaws.com    Database: davinci
-- ------------------------------------------------------
-- Server version	5.7.26-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '';

--
-- Table structure for table `course_enrolments`
--

DROP TABLE IF EXISTS `course_enrolments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_enrolments` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `studentId` int(11) unsigned DEFAULT NULL,
  `courseId` int(11) unsigned DEFAULT NULL,
  `enrolledAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `courseStatus` enum('enroll','unenroll','completed') DEFAULT 'enroll',
  `completedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `course_enrolments_ibfk_1_idx` (`courseId`),
  KEY `course_enrolments_ibfk_2_idx` (`studentId`),
  CONSTRAINT `course_enrolments_ibfk_1` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `course_enrolments_ibfk_2` FOREIGN KEY (`studentId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=771 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_relation`
--

DROP TABLE IF EXISTS `course_relation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_relation` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `courseId` int(11) unsigned DEFAULT NULL,
  `reliesOn` int(11) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `course_relation_ibfk_1` (`courseId`),
  KEY `course_relation_ibfk_2` (`reliesOn`),
  CONSTRAINT `course_relation_ibfk_1` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `course_relation_ibfk_2` FOREIGN KEY (`reliesOn`) REFERENCES `courses` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `type` enum('html','js','python') DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `logo` varchar(100) DEFAULT NULL,
  `notes` varchar(10000) DEFAULT NULL,
  `daysToComplete` int(11) DEFAULT NULL,
  `shortDescription` varchar(300) DEFAULT NULL,
  `sequenceNum` int(11) DEFAULT '1000',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=93 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `exercises`
--

DROP TABLE IF EXISTS `exercises`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exercises` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `parentExerciseId` int(11) unsigned DEFAULT NULL,
  `courseId` int(100) unsigned NOT NULL,
  `name` varchar(300) NOT NULL DEFAULT '',
  `slug` varchar(100) NOT NULL DEFAULT '',
  `sequenceNum` float unsigned DEFAULT NULL,
  `reviewType` enum('manual','peer','facilitator','automatic') DEFAULT 'manual',
  `content` longtext,
  `submissionType` enum('number','text','text_large','attachments','url') DEFAULT NULL,
  `githubLink` varchar(300) DEFAULT NULL,
  `solution` longtext,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug_UNIQUE` (`slug`),
  KEY `course_id` (`courseId`),
  CONSTRAINT `exercises_ibfk_2` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2167 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `knex_migrations`
--

DROP TABLE IF EXISTS `knex_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `knex_migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `batch` int(11) DEFAULT NULL,
  `migration_time` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `knex_migrations_lock`
--

DROP TABLE IF EXISTS `knex_migrations_lock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `knex_migrations_lock` (
  `is_locked` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mentors`
--

DROP TABLE IF EXISTS `mentors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mentors` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `mentor` int(11) unsigned DEFAULT NULL,
  `mentee` int(11) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `mentor_ibfk_1_idx` (`mentor`),
  KEY `mentor_ibfk_2_idx` (`mentee`),
  CONSTRAINT `mentors_ibfk_1` FOREIGN KEY (`mentor`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `mentors_ibfk_2` FOREIGN KEY (`mentee`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `run_on` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notes`
--

DROP TABLE IF EXISTS `notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notes` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `student` int(11) unsigned DEFAULT NULL,
  `facilitator` int(11) unsigned DEFAULT NULL,
  `text` varchar(500) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `submissions`
--

DROP TABLE IF EXISTS `submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `submissions` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `exerciseId` int(11) unsigned NOT NULL,
  `userId` int(11) unsigned NOT NULL,
  `submittedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `submitterNotes` varchar(300) DEFAULT NULL,
  `files` varchar(1000) DEFAULT NULL,
  `peerReviewerId` int(11) unsigned DEFAULT NULL,
  `notesReviewer` varchar(300) DEFAULT NULL,
  `reviewedAt` datetime DEFAULT NULL,
  `state` enum('completed','pending','rejected') DEFAULT NULL,
  `completed` tinyint(1) DEFAULT NULL,
  `completedAt` datetime DEFAULT NULL,
  `markCompletedBy` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `assignmentId` (`exerciseId`),
  KEY `userId` (`userId`),
  KEY `submissions_ibfk_3_idx` (`peerReviewerId`),
  KEY `submissions_ibfk_4` (`markCompletedBy`),
  CONSTRAINT `submissions_ibfk_1` FOREIGN KEY (`exerciseId`) REFERENCES `exercises` (`id`),
  CONSTRAINT `submissions_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
  CONSTRAINT `submissions_ibfk_3` FOREIGN KEY (`peerReviewerId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `submissions_ibfk_4` FOREIGN KEY (`markCompletedBy`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=184 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `userId` int(11) unsigned DEFAULT NULL,
  `roles` enum('admin','alumni','student','facilitator') DEFAULT 'student',
  `center` enum('dharamshala','banagalore','all') DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_role_ibfk_1_idx` (`userId`),
  CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=398 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `email` char(50) NOT NULL DEFAULT '',
  `name` char(100) NOT NULL DEFAULT '',
  `profilePicture` char(150) DEFAULT NULL,
  `googleUserId` char(30) DEFAULT NULL,
  `center` enum('dharamshala','bangalore') DEFAULT NULL,
  `githubLink` varchar(145) DEFAULT NULL,
  `linkedinLink` varchar(145) DEFAULT NULL,
  `mediumLink` varchar(145) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `googleUserId` (`googleUserId`)
) ENGINE=InnoDB AUTO_INCREMENT=544 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vb_sentences`
--

DROP TABLE IF EXISTS `vb_sentences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vb_sentences` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `sentence` varchar(255) NOT NULL,
  `h_translation` varchar(255) NOT NULL DEFAULT '',
  `d_level` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2868 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vb_words`
--

DROP TABLE IF EXISTS `vb_words`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vb_words` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `word` varchar(250) NOT NULL,
  `e_meaning` varchar(250) NOT NULL DEFAULT '',
  `h_meaning` varchar(250) NOT NULL DEFAULT '',
  `word_type` varchar(5) DEFAULT '',
  `d_level` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=114335 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2019-11-06  8:30:56
