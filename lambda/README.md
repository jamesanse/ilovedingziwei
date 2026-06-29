# Lambda Function for S3 Uploads and RDS Logging

This Lambda function (uploadFunc) handles:
1. Generating pre-signed URLs for S3 uploads
2. Recording upload metadata to RDS

## Setup Instructions

### 1. Create RDS Database Table
```sql
CREATE TABLE uploads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    day INT NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    s3_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Create Lambda Function in AWS Console
- Go to AWS Lambda → Create function
- Function name: `uploadFunc`
- Choose Node.js 18.x runtime
- Copy contents of `index.js` into the function code

### 3. Set Environment Variables in Lambda
Add these environment variables in Lambda configuration:
```
RDS_HOST = your-rds-endpoint.ap-east-1.rds.amazonaws.com
RDS_USER = admin
RDS_PASSWORD = your-password
RDS_DATABASE = dingziwei
```

### 4. Create Execution Role with Permissions
Create an IAM policy with these permissions:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "s3:PutObject",
            "Resource": "arn:aws:s3:::dingziwei-app-bucket/uploads/*"
        },
        {
            "Effect": "Allow",
            "Action": "ec2:CreateNetworkInterface",
            "Resource": "*"
        }
    ]
}
```

### 5. Configure VPC Access (if RDS is in VPC)
- Go to Lambda configuration → VPC
- Select the same VPC as your RDS instance
- Select appropriate security groups and subnets

### 6. Update Security Group
- Allow inbound traffic on port 3306 (MySQL) from Lambda security group

### 7. Create API Gateway
- Create REST API
- Create POST resource `/upload`
- Integrate with Lambda function `uploadFunc`
- Enable CORS
- Deploy to a stage

### 8. Lambda Function Actions
The function handles two actions:

**Action 1: Get Pre-signed URL**
```javascript
POST /upload
{
    "action": "getPresignedUrl"
}

Response:
{
    "uploadURL": "https://dingziwei-app-bucket.s3...",
    "fileName": "1234567890-abc123.jpg",
    "s3Path": "s3://dingziwei-app-bucket/uploads/1234567890-abc123.jpg"
}
```

**Action 2: Record Upload to RDS**
```javascript
POST /upload
{
    "action": "recordUpload",
    "fileName": "1234567890-abc123.jpg",
    "s3Path": "s3://dingziwei-app-bucket/uploads/1234567890-abc123.jpg",
    "day": 29
}

Response:
{
    "success": true,
    "message": "Upload recorded in database"
}
```

## Website Integration Flow
1. User selects image
2. Call Lambda with action: "getPresignedUrl" → get upload URL
3. Upload file directly to S3 using the URL
4. Call Lambda with action: "recordUpload" → record metadata to RDS
5. Mark calendar day as completed

## Environment
- Region: `ap-east-1` (Hong Kong)
- Bucket: `dingziwei-app-bucket`
- Timeout: 30 seconds
- Memory: 256 MB (for RDS connection)

