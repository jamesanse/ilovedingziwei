# uploadFunc Lambda

This Lambda function handles S3 uploads and records metadata to RDS.

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
Records upload metadata to RDS database.

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
    "message": "Upload recorded in database"
}
```

## Environment Variables
```
RDS_HOST = your-rds-endpoint.ap-east-1.rds.amazonaws.com
RDS_USER = admin
RDS_PASSWORD = your-password
RDS_DATABASE = dingziwei
```

## Dependencies
- aws-sdk
- mysql2
