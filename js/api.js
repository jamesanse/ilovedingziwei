// API calls to Lambda backend

const API_BASE_URL = 'https://0awq3ahyhi.execute-api.ap-east-1.amazonaws.com/prod';
const UPLOAD_API_URL = API_BASE_URL + '/upload';

// Fetch completed days from Lambda
async function fetchCompletedDays() {
    try {
        const response = await fetch(UPLOAD_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'getCompletedDays'
            })
        });
        
        const data = await response.json();
        if (data.success) {
            return data.completedDays;
        }
    } catch (error) {
        console.error('Error fetching completed days:', error);
    }
    return [];
}

// Get pre-signed URL for S3 upload
async function getPresignedUrl(fileExtension, mimeType) {
    try {
        const response = await fetch(UPLOAD_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'getPresignedUrl',
                fileExtension: fileExtension || 'jpg',
                mimeType: mimeType || 'image/jpeg'
            })
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error getting pre-signed URL:', error);
        throw error;
    }
}

// Record upload to S3 tracking file
async function recordUpload(fileName, s3Path, day) {
    try {
        const response = await fetch(UPLOAD_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'recordUpload',
                fileName: fileName,
                s3Path: s3Path,
                day: day
            })
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error recording upload:', error);
        throw error;
    }
}
