# getCompletedDays Lambda

This Lambda function reads the S3 tracking file to get all completed days for the current month.

## Action

### Query Completed Days
Retrieves all days in the current month that have been completed (stored in tracking file).

**Request:**
```json
{}
```
(No body needed - automatically uses current month in China timezone)

**Response:**
```json
{
    "success": true,
    "month": "2026-06",
    "completedDays": [5, 10, 15, 20, 25, 29],
    "count": 6
}
```

## Usage Flow
1. Website calls this function on page load
2. Gets array of completed days
3. Updates calendar UI to mark those days as completed
4. If file doesn't exist for month yet, returns empty array

## Environment
- Bucket: `dingziwei-app-bucket`
- Tracking file path: `tracking/YYYY-MM.txt`
- Format: Each line is `day|image-url`

## Example Tracking File Content
```
29|s3://dingziwei-app-bucket/uploads/1234567890-abc123.jpg
25|s3://dingziwei-app-bucket/uploads/1234567890-def456.jpg
20|s3://dingziwei-app-bucket/uploads/1234567890-ghi789.jpg
```

## Dependencies
- aws-sdk

## Error Handling
- If tracking file doesn't exist yet: Returns empty completedDays array
- This is normal for the first month

