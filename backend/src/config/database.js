// const { Pool } = require('pg');
// require('dotenv').config();
// const isProduction = process.env.NODE_ENV === 'production';

// const pool = new Pool({
//   host: process.env.DB_HOST,
//   port: process.env.DB_PORT,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   max: 5,
//   min:1,
//   idleTimeoutMillis: 30000,
//   connectionTimeoutMillis: 5000,
//   ssl: isProduction ? { rejectUnauthorized: false } : false,
// });

// // Test connection
// pool.connect((err, client, release) => {
//   if (err) {
//     console.error('❌ Database connection failed:', err.stack);
//     process.exit(1);
//   }
//   console.log('✅ Database connected successfully');
//   release();
// });

// module.exports = pool;


const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('⚠️ Pool error (non-fatal):', err.message);
});

module.exports = pool;