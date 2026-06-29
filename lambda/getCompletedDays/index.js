const AWS = require('aws-sdk');
const s3 = new AWS.S3({ region: 'ap-east-1' });

exports.handler = async (event) => {
    try {
        // Get current month and year in China timezone
        const now = new Date();
        const chinaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
        const month = String(chinaTime.getMonth() + 1).padStart(2, '0');
        const year = chinaTime.getFullYear();
        const monthKey = `${year}-${month}`;
        
        // Read tracking file from S3
        const trackingFileName = `tracking/${monthKey}.txt`;
        
        try {
            const params = {
                Bucket: 'dingziwei-app-bucket',
                Key: trackingFileName
            };
            
            const result = await s3.getObject(params).promise();
            const fileContent = result.Body.toString('utf-8');
            
            // Parse file: each line is "day|image-path"
            const lines = fileContent.trim().split('\n');
            const completedDays = lines
                .map(line => {
                    const parts = line.split('|');
                    return parseInt(parts[0]);
                })
                .filter(day => !isNaN(day))
                .sort((a, b) => a - b);
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: true,
                    month: monthKey,
                    completedDays: completedDays,
                    count: completedDays.length
                })
            };
        } catch (error) {
            // File doesn't exist yet (first month) - return empty list
            if (error.code === 'NoSuchKey') {
                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        success: true,
                        month: monthKey,
                        completedDays: [],
                        count: 0
                    })
                };
            }
            throw error;
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
