# uploadFunc Lambda

This Lambda function handles S3 uploads and tracks completed days using S3 text files.

## Actions

### 1. getPresignedUrl
Generates a pre-signed URL for uploading an image to S3.

**Request:**
```json
{
    "action": "getPresignedUrl"
}
```

**Response:**
```json
{
    "uploadURL": "https://dingziwei-app-bucket.s3.ap-east-1.amazonaws.com/...",
    "fileName": "1234567890-abc123.jpg",
    "s3Path": "s3://dingziwei-app-bucket/uploads/1234567890-abc123.jpg"
}
```

### 2. recordUpload
Records upload to a month-based tracking text file in S3.

**Request:**
```json
{
    "action": "recordUpload",
    "fileName": "1234567890-abc123.jpg",
    "s3Path": "s3://dingziwei-app-bucket/uploads/1234567890-abc123.jpg",
    "day": 29
}
```

**Response:**
```json
{
    "success": true,
    "message": "Upload recorded successfully",
    "fileName": "1234567890-abc123.jpg",
    "day": 29
}
```

## Tracking File Format

Files are stored in `s3://dingziwei-app-bucket/tracking/YYYY-MM.txt`

Example content:
```
5|s3://dingziwei-app-bucket/uploads/1234567890-abc123.jpg
10|s3://dingziwei-app-bucket/uploads/1234567890-def456.jpg
29|s3://dingziwei-app-bucket/uploads/1234567890-ghi789.jpg
```

Each line: `day|s3_path`

## Environment Variables
None required! This function only uses S3.

## Permissions
Lambda needs S3 access:
```json
{
    "Effect": "Allow",
    "Action": [
        "s3:GetObject",
        "s3:PutObject"
    ],
    "Resource": "arn:aws:s3:::dingziwei-app-bucket/*"
}
```

## Dependencies
- aws-sdk (only)

