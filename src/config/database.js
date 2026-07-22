const fs = require('fs');
const { Sequelize } = require('sequelize');
const env = require('./env');

/**
 * Builds mysql2 dialectOptions. When DB_SSL=true we enable a verified TLS
 * connection (required by TiDB Cloud / Aiven). A CA file is only needed on
 * hosts without a public CA bundle; otherwise the system trust store is used.
 */
function buildDialectOptions() {
  if (!env.db.ssl) return {};
  const ssl = { minVersion: 'TLSv1.2', rejectUnauthorized: true };
  if (env.db.sslCaPath) {
    ssl.ca = fs.readFileSync(env.db.sslCaPath);
  }
  return { ssl };
}

/**
 * Runtime Sequelize instance shared by all models.
 */
const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: 'mysql',
  logging: env.isProd ? false : (msg) => console.debug(msg),
  dialectOptions: buildDialectOptions(),
  define: {
    underscored: true,
    timestamps: true,
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

module.exports = sequelize;
