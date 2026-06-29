-- RDS Schema for uploadFunc Lambda
-- Run this SQL on your RDS MySQL database

CREATE DATABASE IF NOT EXISTS dingziwei;
USE dingziwei;

-- Uploads table to track image uploads
CREATE TABLE uploads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    day INT NOT NULL COMMENT 'Day of month (1-31)',
    file_path VARCHAR(255) NOT NULL COMMENT 'Generated file name',
    s3_path VARCHAR(500) NOT NULL COMMENT 'Full S3 path to the file',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_date (date),
    INDEX idx_day (day)
);

-- Example query to retrieve uploads for a specific day
-- SELECT * FROM uploads WHERE date = CURDATE() AND day = 29;

-- Example query to get all uploads for the current month
-- SELECT * FROM uploads WHERE MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE());
