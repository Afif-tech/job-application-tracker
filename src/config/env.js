require('dotenv').config();

/**
 * Centralized, validated environment configuration.
 * Import this everywhere instead of reading process.env directly.
 */
const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    name: process.env.DB_NAME || 'job_application',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    // Enable TLS for managed DBs (TiDB Cloud, Aiven, etc.).
    ssl: process.env.DB_SSL === 'true',
    // Optional path to a CA bundle; usually unnecessary (public CA).
    sslCaPath: process.env.DB_SSL_CA || '',
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },

  upload: {
    maxBytes: parseInt(process.env.UPLOAD_MAX_BYTES || '5242880', 10),
  },

  // Cloudflare R2 (S3-compatible) object storage. When all four are set the
  // storage driver uses R2; otherwise it falls back to local disk.
  r2: {
    accountId: process.env.R2_ACCOUNT_ID || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucket: process.env.R2_BUCKET || '',
  },

  get isProd() {
    return this.nodeEnv === 'production';
  },
};

module.exports = env;
