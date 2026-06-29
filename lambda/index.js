const AWS = require('aws-sdk');
const mysql = require('mysql2/promise');

// Initialize outside handler (reused on warm starts)
const s3 = new AWS.S3({ region: 'ap-east-1' });

// RDS connection pool
let connection;

async function getRDSConnection() {
    if (connection) {
        return connection;
    }
    
    connection = await mysql.createConnection({
        host: process.env.RDS_HOST,
        user: process.env.RDS_USER,
        password: process.env.RDS_PASSWORD,
        database: process.env.RDS_DATABASE,
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0
    });
    
    return connection;
}

exports.handler = async (event) => {
    try {
        // Check if this is a presigned URL request or a record request
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
            // Record upload metadata to RDS
            const { fileName, s3Path, day } = body;
            
            const conn = await getRDSConnection();
            
            const query = `
                INSERT INTO uploads (date, day, file_path, s3_path, created_at)
                VALUES (CURDATE(), ?, ?, ?, NOW())
            `;
            
            await conn.execute(query, [day, fileName, s3Path]);
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: true,
                    message: 'Upload recorded in database'
                })
            };
        }
        
        throw new Error('Invalid action');
        
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
