-- phpMyAdmin SQL Dump
-- version 4.7.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: May 11, 2017 at 01:05 AM
-- Server version: 10.1.21-MariaDB
-- PHP Version: 5.6.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `davinci`
--
use davinci;

-- --------------------------------------------------------

--
-- Table structure for table `batch`
--

CREATE TABLE `batch` (
  `id` int(11) UNSIGNED NOT NULL,
  `facilitator` int(11) UNSIGNED DEFAULT NULL,
  `course` int(11) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `courses`
--

CREATE TABLE `courses` (
  `id` int(10) UNSIGNED NOT NULL,
  `course` enum('html','js','python') DEFAULT NULL,
  `course_logo_url` varchar(45) DEFAULT NULL,
  `notes` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `course_enrolments`
--

CREATE TABLE `course_enrolments` (
  `id` int(11) UNSIGNED NOT NULL,
  `studentId` int(11) UNSIGNED DEFAULT NULL,
  `courseId` int(11) UNSIGNED DEFAULT NULL,
  `enrolled` tinyint(1) DEFAULT '0',
  `batch` int(11) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `course_facilitations`
--

CREATE TABLE `course_facilitations` (
  `id` int(11) UNSIGNED NOT NULL,
  `facilitatorId` int(11) UNSIGNED DEFAULT NULL,
  `courseId` int(11) UNSIGNED DEFAULT NULL,
  `facilitating` tinyint(1) DEFAULT '0',
  `batch` int(11) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `exercises`
--

CREATE TABLE `exercises` (
  `id` int(11) UNSIGNED NOT NULL,
  `name` varchar(30) NOT NULL,
  `slug` varchar(30) NOT NULL,
  `course` enum('html','js','python') DEFAULT NULL,
  `sequenceNum` int(10) UNSIGNED DEFAULT NULL,
  `path` varchar(50) DEFAULT NULL,
  `exerciseReviewType` enum('manual','peer','facilitator','automatic') DEFAULT 'manual',
  `content` varchar(500) DEFAULT NULL,
  `parentExercise` int(11) UNSIGNED DEFAULT NULL,
  `courseId` int(100) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `notes`
--

CREATE TABLE `notes` (
  `id` int(11) UNSIGNED NOT NULL,
  `student` int(11) UNSIGNED DEFAULT NULL,
  `facilitator` int(11) UNSIGNED DEFAULT NULL,
  `text` varchar(500) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `submissions`
--

CREATE TABLE `submissions` (
  `id` int(11) UNSIGNED NOT NULL,
  `exercise` int(11) UNSIGNED NOT NULL,
  `userId` int(11) UNSIGNED NOT NULL,
  `submittedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `path` varchar(1000) DEFAULT NULL,
  `notesStudent` varchar(300) DEFAULT NULL,
  `peerReviewer` int(11) UNSIGNED DEFAULT NULL,
  `approved` tinyint(1) DEFAULT '0',
  `notesReviewer` varchar(300) DEFAULT NULL,
  `reviewedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) UNSIGNED NOT NULL,
  `email` char(50) NOT NULL DEFAULT '',
  `name` char(100) NOT NULL DEFAULT '',
  `profilePicture` char(150) DEFAULT NULL,
  `googleUserId` char(30) DEFAULT NULL,
  `facilitator` int(2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `name`, `profilePicture`, `googleUserId`, `facilitator`) VALUES
(1, 'srivastavadi12@gmail.com', 'Divyanshu Srivastava', 'http://google.png', 'googleid', 0),
(2, '6677aditya@gmail.com', 'Aditya Kumar', 'http://googlek.png', 'googleID1', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `batch`
--
ALTER TABLE `batch`
  ADD PRIMARY KEY (`id`),
  ADD KEY `batch_ibfk_1_idx` (`facilitator`),
  ADD KEY `batch_ibfk_2_idx` (`course`);

--
-- Indexes for table `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course_enrolments`
--
ALTER TABLE `course_enrolments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `course_enrolments_ibfk_1_idx` (`courseId`),
  ADD KEY `course_enrolments_ibfk_2_idx` (`studentId`),
  ADD KEY `course_enrolments_ibfk_3_idx` (`batch`);

--
-- Indexes for table `course_facilitations`
--
ALTER TABLE `course_facilitations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `course_enrolments_ibfk_1_idx` (`courseId`),
  ADD KEY `course_enrolments_ibfk_2_idx` (`facilitatorId`),
  ADD KEY `course_enrolments_ibfk_3_idx` (`batch`);

--
-- Indexes for table `exercises`
--
ALTER TABLE `exercises`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug_UNIQUE` (`slug`),
  ADD KEY `exercises_ibfk_1_idx` (`parentExercise`);

--
-- Indexes for table `notes`
--
ALTER TABLE `notes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `submissions`
--
ALTER TABLE `submissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `assignmentId` (`exercise`),
  ADD KEY `userId` (`userId`),
  ADD KEY `submissions_ibfk_3_idx` (`peerReviewer`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `googleUserId` (`googleUserId`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `batch`
--
ALTER TABLE `batch`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `courses`
--
ALTER TABLE `courses`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `notes`
--
ALTER TABLE `notes`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `submissions`
--
ALTER TABLE `submissions`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
--
-- Constraints for dumped tables
--

--
-- Constraints for table `batch`
--
ALTER TABLE `batch`
  ADD CONSTRAINT `batch_ibfk_1` FOREIGN KEY (`facilitator`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `batch_ibfk_2` FOREIGN KEY (`course`) REFERENCES `courses` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `course_enrolments`
--
ALTER TABLE `course_enrolments`
  ADD CONSTRAINT `course_enrolments_ibfk_1` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `course_enrolments_ibfk_2` FOREIGN KEY (`studentId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `course_enrolments_ibfk_3` FOREIGN KEY (`batch`) REFERENCES `batch` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `exercises`
--
ALTER TABLE `exercises`
  ADD CONSTRAINT `exercises_ibfk_1` FOREIGN KEY (`parentExercise`) REFERENCES `exercises` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `submissions`
--
ALTER TABLE `submissions`
  ADD CONSTRAINT `submissions_ibfk_1` FOREIGN KEY (`exercise`) REFERENCES `exercises` (`id`),
  ADD CONSTRAINT `submissions_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `submissions_ibfk_3` FOREIGN KEY (`peerReviewer`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
