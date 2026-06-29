# Lambda Functions - dingziwei.com

This folder contains AWS Lambda functions for the "dingziwei.com" website, using **S3-based tracking** (no database needed).

## ⚡ Quick Start

**Choose one deployment method:**

1. **Bash Script (Easiest):**
   ```bash
   cd lambda && ./deploy.sh
   ```

2. **CloudFormation:**
   ```bash
   aws cloudformation create-stack \
     --stack-name dingziwei-stack \
     --template-body file://lambda/template.yaml \
     --capabilities CAPABILITY_NAMED_IAM \
     --region ap-east-1
   ```

3. **Manual (AWS Console):**
   - See [DEPLOYMENT.md](DEPLOYMENT.md) → Method 3

**→ See [DEPLOYMENT.md](DEPLOYMENT.md) for complete instructions**

## Architecture

The website uses two Lambda functions that work together:

1. **uploadFunc** - Handles image uploads to S3 and tracking
2. **getCompletedDays** - Retrieves completed days from S3 tracking file

All data is stored as simple text files in S3 (`tracking/YYYY-MM.txt`), eliminating the need for a database.

## Functions Overview

### uploadFunc (`uploadFunc/`)
Handles S3 image uploads and maintains tracking file.

**Two Actions:**
1. `getPresignedUrl` - Generate pre-signed URL for client-side S3 upload
2. `recordUpload` - Record upload metadata to S3 tracking file

**Response Example:**
```json
{
    "uploadURL": "https://dingziwei-app-bucket.s3.ap-east-1.amazonaws.com/...",
    "fileName": "1234567890-abc123.jpg",
    "s3Path": "s3://dingziwei-app-bucket/uploads/1234567890-abc123.jpg"
}
```

### getCompletedDays (`getCompletedDays/`)
Retrieves completed days for the current month.

**Response Example:**
```json
{
    "success": true,
    "month": "2026-06",
    "completedDays": [5, 10, 15, 20, 25, 29],
    "count": 6
}
```

## S3 Tracking Format

- **Location:** `s3://dingziwei-app-bucket/tracking/YYYY-MM.txt`
- **Format:** One entry per line: `day|image-s3-path`
- **Example:**
  ```
  29|s3://dingziwei-app-bucket/uploads/1234567890-abc123.jpg
  25|s3://dingziwei-app-bucket/uploads/1234567890-def456.jpg
  20|s3://dingziwei-app-bucket/uploads/1234567890-ghi789.jpg
  ```

## Deployment Steps

### 1. Prepare Lambda Packages
```bash
cd uploadFunc && npm install && cd ..
cd getCompletedDays && npm install && cd ..
```

### 2. Create Lambda Functions in AWS Console
For each function:
- **Name:** `uploadFunc` or `getCompletedDays`
- **Runtime:** Node.js 18.x
- **Handler:** `index.handler`
- **Code:** Copy from `index.js` in each folder

### 3. Configure IAM Role
Create an execution role with these S3 permissions:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::dingziwei-app-bucket",
                "arn:aws:s3:::dingziwei-app-bucket/*"
            ]
        }
    ]
}
```

### 4. Create API Gateway
Create REST API with endpoints:

| Method | Path | Function |
|--------|------|----------|
| POST | `/upload` | uploadFunc |
| POST | `/completed-days` | getCompletedDays |

- Enable CORS on both endpoints
- Deploy to stage (e.g., `prod`)
- Get API base URL: `https://xxxxx.execute-api.ap-east-1.amazonaws.com/prod`

### 5. Update Website
Update `script.js` to use API Gateway URLs:
```javascript
const API_BASE = "https://xxxxx.execute-api.ap-east-1.amazonaws.com/prod";
```

## Cost Analysis
- **uploadFunc:** ~$0.50/month (pay-per-use, minimal invocations)
- **getCompletedDays:** ~$0.10/month (called once per page load)
- **API Gateway:** ~$0.35/month (pay-per-call)
- **S3 Storage:** ~$0.50/month (tracking files + images)
- **Total:** ~$1.50/month

Compare to RDS: RDS alone would cost ~$15/month minimum.

## Configuration
- **Region:** `ap-east-1` (Hong Kong)
- **Bucket:** `dingziwei-app-bucket`
- **Timezone:** Asia/Shanghai (UTC+8)
- **Environment Variables:** None needed! Uses AWS SDK default credentials

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
└── README.md (this file)
```

## Why No Database?

✅ **Benefits of S3 Text Files:**
- No database subscription cost (~$15/month saved)
- No VPC configuration needed
- No credentials to manage
- Simple `day|path` format, easy to understand
- Auto-scales with S3
- 30-day free tier covers our usage
- Perfect for single-user applications

## Testing

### Local Testing (with AWS credentials)
```bash
# Test uploadFunc
node -e "
const handler = require('./uploadFunc/index.js').handler;
handler({action: 'getPresignedUrl'}, {}, (err, res) => console.log(JSON.stringify(res, null, 2)));
"

# Test getCompletedDays
node -e "
const handler = require('./getCompletedDays/index.js').handler;
handler({}, {}, (err, res) => console.log(JSON.stringify(res, null, 2)));
"
```

### From Website
The website will call these Lambda functions via API Gateway after deployment.

## Documentation
- [uploadFunc Details](uploadFunc/README.md)
- [getCompletedDays Details](getCompletedDays/README.md)
