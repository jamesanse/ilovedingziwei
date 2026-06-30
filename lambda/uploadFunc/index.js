/**
 * Lambda Function: uploadFunc
 * 
 * PURPOSE:
 * Manages image uploads and daily tracking for the ilovedingziwei website.
 * Handles pre-signed URL generation, upload recording, and image retrieval.
 * 
 * ARCHITECTURE:
 * - S3 Bucket: dingziwei-app-bucket
 *   ├── uploads/: All user-uploaded images (YYYY-MM-DDTHH:mm:ss-random.ext)
 *   └── tracking/: Month-indexed tracking files (YYYY-MM.txt)
 * 
 * TXT FILE STRUCTURE (tracking/YYYY-MM.txt):
 * ============================================
 * Format: day|s3-full-path
 * One line per uploaded day (days 1-31)
 * Days are sorted in ascending order
 * 
 * Example (tracking/2026-06.txt):
 * 1|s3://dingziwei-app-bucket/uploads/1782682800000-abc123.jpg
 * 5|s3://dingziwei-app-bucket/uploads/1782769790584-xyz789.jpg
 * 15|s3://dingziwei-app-bucket/uploads/1782856500000-def456.png
 * 
 * UPLOAD FLOW:
 * ============
 * 1. Frontend calls getPresignedUrl(fileExtension, mimeType)
 *    └─> Lambda returns temporary signed URL (900s) + fileName + s3Path
 * 
 * 2. Frontend uploads image directly to S3 using pre-signed URL
 *    └─> Image stored at: s3://dingziwei-app-bucket/uploads/{timestamp}-{random}.{ext}
 * 
 * 3. Frontend calls recordUpload(fileName, s3Path, day, month, year)
 *    └─> Lambda reads tracking/YYYY-MM.txt
 *    └─> Checks if day already exists (prevents duplicates)
 *    └─> Appends "day|s3Path\n" to file
 *    └─> Writes updated file back to S3
 * 
 * 4. Frontend calls getCompletedDays(month, year) [optional]
 *    └─> Lambda reads tracking/YYYY-MM.txt
 *    └─> Parses and returns array of completed days
 *    └─> Frontend highlights days in calendar UI
 * 
 * 5. Frontend calls getImageUrl(year, month, day) to view completed upload
 *    └─> Lambda reads tracking/YYYY-MM.txt
 *    └─> Finds line starting with "day|"
 *    └─> Extracts and returns S3 image URL (or null if not found)
 *    └─> Frontend displays image in modal
 * 
 * KEY FEATURES:
 * - Resilient: month/year passed in recordUpload avoids timezone bugs
 * - Idempotent: recordUpload checks if day exists before appending
 * - Direct upload: Pre-signed URLs allow browser to upload to S3 directly (no Lambda overhead)
 * - Simple format: Plain text tracking allows easy debugging and management
 */

const AWS = require('aws-sdk');
const s3 = new AWS.S3({ region: process.env.AWS_REGION || 'ap-east-1' });

// Helper function to convert s3:// URL to HTTPS URL (Path Style)
function s3UrlToHttps(s3Url) {
    if (!s3Url || !s3Url.startsWith('s3://')) {
        return s3Url;
    }
    // Convert s3://bucket/key to https://s3.{region}.amazonaws.com/bucket/key (Path Style)
    const match = s3Url.match(/^s3:\/\/([^/]+)\/(.+)$/);
    if (!match) return s3Url;
    
    const bucket = match[1];
    const key = match[2];
    const region = process.env.AWS_REGION || 'ap-east-1';
    return `https://s3.${region}.amazonaws.com/${bucket}/${key}`;
}

// Helper function to return response with CORS headers
function createResponse(statusCode, body) {
    return {
        statusCode: statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
        },
        body: JSON.stringify(body)
    };
}

exports.handler = async (event) => {
    // Always return CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
    };
    
    try {
        
        const body = JSON.parse(event.body);
        
        if (body.action === 'getPresignedUrl') {
            /**
             * ACTION: getPresignedUrl
             * 
             * PURPOSE: Generate temporary signed URL for direct S3 upload
             * 
             * INPUT: { action: 'getPresignedUrl', fileExtension, mimeType }
             * OUTPUT: { uploadURL, fileName, s3Path }
             * 
             * FLOW:
             * 1. Receive file extension and MIME type from frontend
             * 2. Generate random fileName with timestamp (preserves original format)
             * 3. Create pre-signed PUT URL valid for 900 seconds (15 min)
             * 4. Return URL + path info for frontend to use
             * 
             * SECURITY: Pre-signed URLs are scoped to:
             *   - Specific S3 path (uploads/{fileName})
             *   - Specific action (putObject)
             *   - Specific MIME type
             *   - 15-minute expiry
             */
            const fileExtension = body.fileExtension || 'jpg';
            const mimeType = body.mimeType || 'image/jpeg';
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
            
            const params = {
                Bucket: 'dingziwei-app-bucket',
                Key: `uploads/${fileName}`,
                Expires: 900, // 15 minutes
                ContentType: mimeType
            };
            
            const uploadURL = s3.getSignedUrl('putObject', params);
            
            return createResponse(200, {
                uploadURL: uploadURL,
                fileName: fileName,
                s3Path: `s3://dingziwei-app-bucket/uploads/${fileName}`
            });
        } 
        else if (body.action === 'recordUpload') {
            /**
             * ACTION: recordUpload
             * 
             * PURPOSE: Record upload in month's tracking file
             * 
             * INPUT: { action: 'recordUpload', fileName, s3Path, day, month, year }
             * OUTPUT: { success, message, fileName, day }
             * 
             * FLOW:
             * 1. Receive s3Path from frontend (result of direct upload)
             * 2. Parse month/year to construct tracking file name
             * 3. Read existing tracking/{YYYY-MM}.txt (if exists)
             * 4. Check if day already exists (prevent duplicate entries)
             * 5. If exists: replace the entry with new s3Path
             *    If new: append "day|s3Path\n" to file
             * 6. Write updated file back to S3
             * 
             * RESILIENCE:
             * - Month/year passed from frontend (not derived in Lambda)
             * - Prevents timezone bugs that could cause wrong month file
             * - Allows overwriting if same day is uploaded again
             * - Handles NoSuchKey gracefully (first upload of month)
             */
            const { fileName, s3Path, day, month, year } = body;
            
            // Use provided month/year for resilience
            const monthFile = `${year}-${String(month).padStart(2, '0')}.txt`;
            
            try {
                // Try to read existing file
                const getParams = {
                    Bucket: 'dingziwei-app-bucket',
                    Key: `tracking/${monthFile}`
                };
                
                let fileContent = '';
                try {
                    const existingFile = await s3.getObject(getParams).promise();
                    fileContent = existingFile.Body.toString('utf-8');
                } catch (err) {
                    if (err.code !== 'NoSuchKey') throw err;
                    fileContent = '';
                }
                
                // Check if day already exists in file
                const lines = fileContent.split('\n').filter(line => line.trim());
                const dayIndex = lines.findIndex(line => line.startsWith(day + '|'));
                
                if (dayIndex !== -1) {
                    // Replace existing entry
                    lines[dayIndex] = `${day}|${s3Path}`;
                    fileContent = lines.join('\n') + '\n';
                } else {
                    // Append new entry
                    if (fileContent && !fileContent.endsWith('\n')) {
                        fileContent += '\n';
                    }
                    fileContent += `${day}|${s3Path}\n`;
                }
                
                // Write updated file back to S3
                const putParams = {
                    Bucket: 'dingziwei-app-bucket',
                    Key: `tracking/${monthFile}`,
                    Body: fileContent,
                    ContentType: 'text/plain'
                };
                
                await s3.putObject(putParams).promise();
                
                return createResponse(200, {
                    success: true,
                    message: 'Upload recorded successfully',
                    fileName: fileName,
                    day: day
                });
            } catch (s3Error) {
                console.error('S3 Error:', s3Error);
                return createResponse(500, { error: 'Failed to record upload: ' + s3Error.message });
            }
        }
        else if (body.action === 'getCompletedDays') {
            /**
             * ACTION: getCompletedDays
             * 
             * PURPOSE: Fetch list of completed days for a specific month
             * 
             * INPUT: { action: 'getCompletedDays', year, month }
             * OUTPUT: { success, month, completedDays: [1, 5, 15, ...] }
             * 
             * FLOW:
             * 1. Validate that year and month are provided
             * 2. Construct tracking file name: tracking/YYYY-MM.txt
             * 3. Read file from S3
             * 4. Parse each line to extract day number
             * 5. Return sorted array of day numbers
             * 
             * RESILIENCE:
             * - Requires year/month passed from frontend
             * - Prevents timezone bugs that could cause wrong month file
             * - Returns error if year/month not provided
             * 
             * USAGE:
             * Frontend must pass current month's year/month to load calendar
             */
            // Fetch completed days from tracking file
            const year = body.year;
            const month = body.month;
            
            // Require year and month - no fallback
            if (!year || !month) {
                return createResponse(400, { error: 'Missing year or month parameter' });
            }
            
            const monthFile = `${year}-${String(month).padStart(2, '0')}.txt`;
            
            try {
                const getParams = {
                    Bucket: 'dingziwei-app-bucket',
                    Key: `tracking/${monthFile}`
                };
                
                let completedDays = [];
                try {
                    const fileContent = await s3.getObject(getParams).promise();
                    const text = fileContent.Body.toString('utf-8');
                    const lines = text.split('\n').filter(line => line.trim());
                    completedDays = lines.map(line => {
                        const day = line.split('|')[0];
                        return parseInt(day);
                    }).sort((a, b) => a - b);
                } catch (err) {
                    if (err.code !== 'NoSuchKey') throw err;
                    completedDays = [];
                }
                
                return createResponse(200, {
                    success: true,
                    month: `${year}-${String(month).padStart(2, '0')}`,
                    completedDays: completedDays
                });
            } catch (err) {
                console.error('Error fetching completed days:', err);
                return createResponse(500, { error: err.message });
            }
        }
        else if (body.action === 'getImageUrl') {
            /**
             * ACTION: getImageUrl
             * 
             * PURPOSE: Retrieve public HTTPS URL for viewing an image from a specific day
             * 
             * INPUT: { action: 'getImageUrl', year, month, day }
             * OUTPUT: { success, year, month, day, imageUrl: 'https://...' or null }
             * 
             * FLOW:
             * 1. Receive year/month/day from frontend
             * 2. Read tracking/{YYYY-MM}.txt from S3
             * 3. Search for line starting with "{day}|"
             * 4. Extract S3 object path from that line
             * 5. Convert s3:// URL to public HTTPS URL (Path Style)
             * 6. Return public URL (imageUrl is null if day not found)
             * 
             * SECURITY:
             * - Objects in /uploads/ are publicly readable
             * - Bucket policy allows GetObject for arn:aws:s3:::dingziwei-app-bucket/uploads/*
             * - No need for pre-signed URLs or authentication
             * 
             * URL FORMAT:
             * - Input format in tracking file: s3://dingziwei-app-bucket/uploads/filename.jpg
             * - Output format to frontend: https://s3.ap-east-1.amazonaws.com/dingziwei-app-bucket/uploads/filename.jpg
             * - Browsers can fetch directly (public read access)
             * 
             * USAGE:
             * Frontend calls this when user clicks on a completed day
             * to fetch and display the image in a modal
             * 
             * RETURNS null if:
             * - Tracking file doesn't exist (no uploads that month)
             * - Day not found in tracking file
             */
            const { year, month, day } = body;
            
            if (!year || !month || !day) {
                return createResponse(400, { error: 'Missing year, month, or day parameter' });
            }
            
            const monthFile = `${year}-${String(month).padStart(2, '0')}.txt`;
            
            try {
                const getParams = {
                    Bucket: 'dingziwei-app-bucket',
                    Key: `tracking/${monthFile}`
                };
                
                let imageUrl = null;
                try {
                    const fileContent = await s3.getObject(getParams).promise();
                    const text = fileContent.Body.toString('utf-8');
                    const lines = text.split('\n').filter(line => line.trim());
                    
                    // Find the line for this day
                    const dayLine = lines.find(line => line.startsWith(day + '|'));
                    if (dayLine) {
                        const s3Path = dayLine.split('|')[1]; // e.g., "s3://bucket/uploads/filename.jpg"
                        // Convert s3:// to HTTPS (Path Style)
                        imageUrl = s3UrlToHttps(s3Path);
                    }
                } catch (err) {
                    if (err.code !== 'NoSuchKey') throw err;
                }
                
                return createResponse(200, {
                    success: true,
                    year: year,
                    month: month,
                    day: day,
                    imageUrl: imageUrl
                });
            } catch (err) {
                console.error('Error fetching image URL:', err);
                return createResponse(500, { error: err.message });
            }
        }
        
    } catch (error) {
        console.error('Error:', error);
        return createResponse(500, { error: error.message });
    }
};
