# getCompletedDays Lambda

This Lambda function queries the RDS database to get all completed days for the current month.

## Action

### Query Completed Days
Retrieves all days in the current month that have at least one upload record.

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
3. Updates localStorage with completed days
4. Marks those calendar days as completed

## Environment Variables
```
RDS_HOST = your-rds-endpoint.ap-east-1.rds.amazonaws.com
RDS_USER = admin
RDS_PASSWORD = your-password
RDS_DATABASE = dingziwei
```

## Features
- Automatically uses China timezone (UTC+8)
- Gets current month/year dynamically
- Returns deduplicated list of completed days
- Includes completion count

## Dependencies
- mysql2
