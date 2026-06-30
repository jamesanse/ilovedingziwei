// API calls to Lambda backend

const API_BASE_URL = 'https://0awq3ahyhi.execute-api.ap-east-1.amazonaws.com/prod';
const UPLOAD_API_URL = API_BASE_URL + '/upload';

// Fetch completed days from Lambda
async function fetchCompletedDays(year, month) {
    try {
        const body = {
            action: 'getCompletedDays'
        };
        
        // Optionally include year and month for resilience
        if (year && month) {
            body.year = year;
            body.month = month;
        }
        
        const response = await fetch(UPLOAD_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
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
async function recordUpload(fileName, s3Path, day, month, year) {
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
                day: day,
                month: month,
                year: year
            })
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error recording upload:', error);
        throw error;
    }
}

// Get image URL for a specific day
async function getImageUrl(year, month, day) {
    try {
        const response = await fetch(UPLOAD_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'getImageUrl',
                year: year,
                month: month,
                day: day
            })
        });
        
        const data = await response.json();
        if (data.success) {
            return data.imageUrl;
        }
    } catch (error) {
        console.error('Error getting image URL:', error);
    }
    return null;
}
