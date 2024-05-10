const { pool } = require('./db'); 

async function insertData(sentData) {
    const client = await pool.connect();
    try {
        const query = 'INSERT INTO lb_table (sentData) VALUES ($1)';
        await client.query(query, [sentData]);
        console.log('Data inserted successfully');
    } catch (error) {
        Error.captureStackTrace(error);
        console.error('Error inserting data:', error);
    } finally {
        client.release(); 
    }
}
  
async function getAllData() {
    const client = await pool.connect();
    try {
        const query = 'SELECT * FROM lb_table';
        const result = await client.query(query);
        return result.rows; // Return the retrieved data
    } catch (error) {
        Error.captureStackTrace(error);
        console.error('Error retrieving data:', error);
        throw error; 
    } finally {
        client.release(); 
    }
}

module.exports = { insertData, getAllData };
