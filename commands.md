# Export Schema of the Database
mysqldump -u root -p --no-data davinci > schema.sql

# Import Schema
mysql -u username -p davinci < schema.sqL
