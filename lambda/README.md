# Lambda Functions

This folder contains Lambda functions for the dingziwei app.

## Functions

### 1. uploadFunc
Handles S3 uploads and records metadata to RDS.
- Generates pre-signed URLs for S3 upload
- Records upload metadata to database

See [uploadFunc/README.md](uploadFunc/README.md) for details.

### 2. getCompletedDays
Queries RDS to get completed days for the current month.
- Retrieves all days with uploads
- Returns array of completed day numbers
- Uses China timezone (UTC+8)

See [getCompletedDays/README.md](getCompletedDays/README.md) for details.

## Setup Overview

### 1. Create RDS Database
Run the SQL from [schema.sql](schema.sql) on your RDS instance.

### 2. Deploy Lambda Functions
1. Create two Lambda functions in AWS console
2. Name them: `uploadFunc` and `getCompletedDays`
3. Choose Node.js 18.x runtime
4. Copy the code from each function's folder
5. Set environment variables for both:
   - `RDS_HOST`
   - `RDS_USER`
   - `RDS_PASSWORD`
   - `RDS_DATABASE`
6. Configure VPC access to your RDS instance

### 3. Create API Gateway
Create REST API with two POST endpoints:
- `/upload` → uploadFunc
- `/completed-days` → getCompletedDays

Enable CORS on both endpoints.

## Environment Variables (for all functions)
```
RDS_HOST = your-rds-endpoint.ap-east-1.rds.amazonaws.com
RDS_USER = admin
RDS_PASSWORD = your-password
RDS_DATABASE = dingziwei
```

## File Structure
```
lambda/
├── uploadFunc/
│   ├── index.js
│   ├── package.json
│   └── README.md
├── getCompletedDays/
│   ├── index.js
│   ├── package.json
│   └── README.md
├── schema.sql
└── README.md (this file)
```

## Configuration Notes
- Region: `ap-east-1` (Hong Kong)
- Bucket: `dingziwei-app-bucket`
- Database: `dingziwei`
- Timezone: Asia/Shanghai (UTC+8)
