import oracledb from 'oracledb';
import dotenv from 'dotenv';

dotenv.config();

// Set oracledb connection pool configuration
oracledb.poolMax = 10;
oracledb.poolMin = 2;
oracledb.poolIncrement = 2;
oracledb.poolTimeout = 60;

// Default configuration if environment variables are not set
const dbConfig = {
  user: process.env.DB_USER || 'smart_storage_admin',
  password: process.env.DB_PASSWORD || 'secure_password',
  connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/XE',
};

// Create a connection pool
async function initialize() {
  try {
    await oracledb.createPool(dbConfig);
    console.log('Connection pool created successfully');
  } catch (err) {
    console.error('Error creating connection pool:', err);
    throw err;
  }
}

// Get a connection from the pool
async function getConnection() {
  try {
    return await oracledb.getConnection();
  } catch (err) {
    console.error('Error getting connection from pool:', err);
    throw err;
  }
}

// Execute a query and return the results
async function executeQuery(sql, binds = [], options = {}) {
  let connection;
  
  try {
    // Get a connection from the pool
    connection = await getConnection();
    
    // Set default options
    const defaultOptions = {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
    };
    
    // Execute the query
    const result = await connection.execute(sql, binds, { ...defaultOptions, ...options });
    
    return result;
  } catch (err) {
    console.error('Error executing query:', err);
    throw err;
  } finally {
    // Release the connection back to the pool
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
}

// Close the connection pool
async function closePool() {
  try {
    await oracledb.getPool().close(10);
    console.log('Connection pool closed');
  } catch (err) {
    console.error('Error closing connection pool:', err);
    throw err;
  }
}

export default {
  initialize,
  executeQuery,
  closePool,
};