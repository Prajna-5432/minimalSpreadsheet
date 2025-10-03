const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection pool with proper configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'spreadsheet_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  min: 2, // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  maxUses: 7500, // Close (and replace) a connection after it has been used this many times
});

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('PostgreSQL connection error:', err);
  // Don't exit the process, just log the error
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down database connection pool...');
  pool.end(() => {
    console.log('Database connection pool closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Shutting down database connection pool...');
  pool.end(() => {
    console.log('Database connection pool closed');
    process.exit(0);
  });
});

module.exports = pool;

