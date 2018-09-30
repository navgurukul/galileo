INSERT INTO batches (name, facilitatorId, courseId )
SELECT "b1", 29, courses.id
FROM courses
WHERE NOT EXISTS (SELECT batches.id FROM batches WHERE courses.id = batches.courseId);
