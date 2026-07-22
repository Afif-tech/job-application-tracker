/**
 * Configuration consumed by sequelize-cli (migrations & seeders).
 * The runtime app uses src/config/database.js instead.
 */
require('dotenv').config();
const fs = require('fs');

function dialectOptions() {
  if (process.env.DB_SSL !== 'true') return {};
  const ssl = { minVersion: 'TLSv1.2', rejectUnauthorized: true };
  if (process.env.DB_SSL_CA) {
    ssl.ca = fs.readFileSync(process.env.DB_SSL_CA);
  }
  return { ssl };
}

const common = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'job_application',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  dialect: 'mysql',
  dialectOptions: dialectOptions(),
  define: {
    underscored: true,
    timestamps: true,
  },
};

module.exports = {
  development: { ...common },
  test: { ...common, database: `${common.database}_test` },
  production: { ...common, logging: false },
};
