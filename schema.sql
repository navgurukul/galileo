-- MySQL dump 10.13  Distrib 5.7.17, for osx10.12 (x86_64)
--
-- Host: localhost    Database: davinci
-- ------------------------------------------------------
-- Server version	5.7.17

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `batches`
--

DROP TABLE IF EXISTS `batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `batches` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `facilitatorId` int(11) unsigned DEFAULT NULL,
  `courseId` int(11) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `batch_ibfk_1_idx` (`facilitatorId`),
  KEY `batch_ibfk_2_idx` (`courseId`),
  CONSTRAINT `batches_ibfk_1` FOREIGN KEY (`facilitatorId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `batches_ibfk_2` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `course_enrolments`
--

DROP TABLE IF EXISTS `course_enrolments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_enrolments` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `studentId` int(11) unsigned DEFAULT NULL,
  `courseId` int(11) unsigned DEFAULT NULL,
  `batchId` int(11) unsigned DEFAULT NULL,
  `enrolled` tinyint(1) DEFAULT '1',
  `enrolledAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `course_enrolments_ibfk_1_idx` (`courseId`),
  KEY `course_enrolments_ibfk_2_idx` (`studentId`),
  KEY `course_enrolments_ibfk_3_idx` (`batchId`),
  CONSTRAINT `course_enrolments_ibfk_1` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `course_enrolments_ibfk_2` FOREIGN KEY (`studentId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `course_enrolments_ibfk_3` FOREIGN KEY (`batchId`) REFERENCES `batches` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `courses` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `type` enum('html','js','python') DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `logo` varchar(45) DEFAULT NULL,
  `notes` varchar(10000) DEFAULT NULL,
  `daysToComplete` int(11) DEFAULT NULL,
  `shortDescription` varchar(300) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `exercises`
--

DROP TABLE IF EXISTS `exercises`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `exercises` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `parentExerciseId` int(11) unsigned DEFAULT NULL,
  `courseId` int(100) unsigned NOT NULL,
  `name` varchar(300) NOT NULL DEFAULT '',
  `slug` varchar(100) NOT NULL DEFAULT '',
  `sequenceNum` float unsigned DEFAULT NULL,
  `reviewType` enum('manual','peer','facilitator','automatic') DEFAULT 'manual',
  `content` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug_UNIQUE` (`slug`),
  KEY `course_id` (`courseId`),
  CONSTRAINT `exercises_ibfk_2` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notes`
--

DROP TABLE IF EXISTS `notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
/*!40101 SET character_set_client = utf8 */;
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
  PRIMARY KEY (`id`),
  KEY `assignmentId` (`exerciseId`),
  KEY `userId` (`userId`),
  KEY `submissions_ibfk_3_idx` (`peerReviewerId`),
  CONSTRAINT `submissions_ibfk_1` FOREIGN KEY (`exerciseId`) REFERENCES `exercises` (`id`),
  CONSTRAINT `submissions_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
  CONSTRAINT `submissions_ibfk_3` FOREIGN KEY (`peerReviewerId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `email` char(50) NOT NULL DEFAULT '',
  `name` char(100) NOT NULL DEFAULT '',
  `profilePicture` char(150) DEFAULT NULL,
  `googleUserId` char(30) DEFAULT NULL,
  `facilitator` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `googleUserId` (`googleUserId`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2017-06-07 19:52:07
