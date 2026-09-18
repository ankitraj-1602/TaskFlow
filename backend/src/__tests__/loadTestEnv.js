const path = require('path');

// Load .env.test BEFORE any other code reads process.env
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env.test'),
  override: true,
});

process.env.NODE_ENV = 'test';