const AWS = require('aws-sdk');
const s3 = new AWS.S3({ region: 'ap-east-1' });

exports.handler = async (event) => {
    try {
        const body = event.body ? JSON.parse(event.body) : event;
        
        if (body.action === 'getPresignedUrl') {
            // Generate pre-signed URL for upload
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
            
            const params = {
                Bucket: 'dingziwei-app-bucket',
                Key: `uploads/${fileName}`,
                Expires: 900, // 15 minutes
                ContentType: 'image/jpeg'
            };
            
            const uploadURL = s3.getSignedUrl('putObject', params);
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    uploadURL: uploadURL,
                    fileName: fileName,
                    s3Path: `s3://dingziwei-app-bucket/uploads/${fileName}`
                })
            };
        } 
        else if (body.action === 'recordUpload') {
            // Record upload to month's text file in S3
            const { fileName, s3Path, day } = body;
            
            // Get current date in China timezone
            const now = new Date();
            const chinaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
            const month = String(chinaTime.getMonth() + 1).padStart(2, '0');
            const year = chinaTime.getFullYear();
            const monthFile = `${year}-${month}.txt`;
            
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
                const dayExists = lines.some(line => line.startsWith(day + '|'));
                
                if (!dayExists) {
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
                
                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        success: true,
                        message: 'Upload recorded successfully',
                        fileName: fileName,
                        day: day
                    })
                };
            } catch (s3Error) {
                console.error('S3 Error:', s3Error);
                return {
                    statusCode: 500,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'Failed to record upload: ' + s3Error.message })
                };
            }
        }
        else if (body.action === 'getCompletedDays') {
            // Fetch completed days from tracking file
            const now = new Date();
            const chinaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
            const month = String(chinaTime.getMonth() + 1).padStart(2, '0');
            const year = chinaTime.getFullYear();
            const monthFile = `${year}-${month}.txt`;
            
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
                
                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        success: true,
                        month: `${year}-${month}`,
                        completedDays: completedDays
                    })
                };
            } catch (err) {
                console.error('Error fetching completed days:', err);
                return {
                    statusCode: 500,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: err.message })
                };
            }
        }
        
        
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: error.message })
        };
    }
};
