/* Replace with your SQL commands */
ALTER TABLE submissions ADD COLUMN markCompletedBy INT UNSIGNED;
ALTER TABLE submissions ADD CONSTRAINT submissions_ibfk_4 FOREIGN KEY (markCompletedBy) REFERENCES users(id);

