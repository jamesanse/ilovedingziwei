# Lambda Functions - dingziwei.com

This folder contains AWS Lambda functions for the "dingziwei.com" website, using **S3-based tracking** (no database needed).

## ⚡ Quick Start

Run the deployment script:

```bash
cd lambda && ./deploy.sh
```

⏱️ Wait 2-3 minutes for completion

See [DEPLOYMENT.md](DEPLOYMENT.md) or [QUICK-REFERENCE.md](QUICK-REFERENCE.md) for detailed instructions

## Architecture

The website uses a **single Lambda function** that handles all backend operations:

1. **uploadFunc** - Multi-action function:
   - Generates pre-signed URLs for client-side S3 uploads
   - Records upload metadata to S3 tracking file
   - Retrieves completed days from tracking file

All data is stored as simple text files in S3 (`tracking/YYYY-MM.txt`), eliminating the need for a database.

## Functions Overview

### uploadFunc (`uploadFunc/`)
Handles S3 image uploads, tracking, and completion queries.

**Three Actions:**
1. `getPresignedUrl` - Generate pre-signed URL for client-side S3 upload
2. `recordUpload` - Record upload metadata to S3 tracking file
3. `getCompletedDays` - Retrieve completed days for the current month

**Request Example (getPresignedUrl):**
```json
{
    "action": "getPresignedUrl"
}
```

**Response Example:**
```json
{
    "uploadURL": "https://dingziwei-app-bucket.s3.ap-east-1.amazonaws.com/...",
    "fileName": "1234567890-abc123.jpg",
    "s3Path": "s3://dingziwei-app-bucket/uploads/1234567890-abc123.jpg"
}
```

**Request Example (getCompletedDays):**
```json
{
    "action": "getCompletedDays"
}
```

**Response Example (getCompletedDays):**
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

**Just run the deployment script!**

```bash
cd lambda
./deploy.sh
```

The script automatically:
1. ✅ Creates IAM role with S3 permissions
2. ✅ Packages and deploys `uploadFunc`
3. ✅ Creates API Gateway with `/upload` endpoint
4. ✅ Enables CORS
5. ✅ Deploys to prod stage
6. ✅ Outputs the API endpoint

**Manual deployment is no longer needed** — `deploy.sh` handles all AWS resource creation.

### API Endpoint

After deployment, you'll get an endpoint like:
```
https://xxxxx.execute-api.ap-east-1.amazonaws.com/prod
```

All operations go to:
```
POST /upload
```

with `action` parameter routing to:
- `action: "getPresignedUrl"` → Generate upload URL
- `action: "recordUpload"` → Save completion record
- `action: "getCompletedDays"` → Fetch completed days

## Cost Analysis
- **uploadFunc:** ~$0.50/month (3 actions: pre-signed URL, record upload, get completions)
- **API Gateway:** ~$0.35/month (pay-per-call)
- **S3 Storage:** ~$0.50/month (tracking files + images)
- **Total:** ~$1.35/month

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
