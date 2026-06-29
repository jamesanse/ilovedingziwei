const mysql = require('mysql2/promise');

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
        const conn = await getRDSConnection();
        
        // Get current month and year in China timezone
        const now = new Date();
        const chinaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
        const month = String(chinaTime.getMonth() + 1).padStart(2, '0');
        const year = chinaTime.getFullYear();
        
        // Query to get all completed days for current month
        const query = `
            SELECT DISTINCT day 
            FROM uploads 
            WHERE MONTH(date) = ? AND YEAR(date) = ?
            ORDER BY day ASC
        `;
        
        const [rows] = await conn.execute(query, [month, year]);
        
        // Extract just the day numbers into an array
        const completedDays = rows.map(row => row.day);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                month: `${year}-${month}`,
                completedDays: completedDays,
                count: completedDays.length
            })
        };
        
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
