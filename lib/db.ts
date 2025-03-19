import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
})

// export async function query(sql: string, params: any[] = []) {
//     try {
//         const [results] = await pool.query(sql, params);
//         return results;
//     } catch (error) {
//         console.error('Error in query', error);
//         throw error
//     }
// }

export async function query<T = any[]>(sql: string, params: any[] = []): Promise<T> {
    const [rows] = await pool.query(sql, params);
    
    // Ensure it always returns an array
    if (!Array.isArray(rows)) {
      return [] as T; // Return an empty array if it's an OkPacket
    }
  
    return rows as T; // Return data rows as expected
  }

export default { query }