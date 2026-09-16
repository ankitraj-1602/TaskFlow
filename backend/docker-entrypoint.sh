#!/bin/sh
set -e

echo "🚀 TaskFlow Backend starting..."

# Wait for Postgres to be ready
echo "⏳ Waiting for PostgreSQL..."
until node -e "
  const { Pool } = require('pg');
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  pool.query('SELECT 1')
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
" 2>/dev/null; do
  echo "   Postgres not ready, waiting 2s..."
  sleep 2
done

echo "✅ PostgreSQL ready"

# Run migrations
echo "📦 Running migrations..."
node src/db/migrate.js

# Start the server (exec replaces this process with node)
echo "🎯 Starting server..."
exec "$@"