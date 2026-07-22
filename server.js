const app = require('./src/app');
const env = require('./src/config/env');
const { sequelize } = require('./src/models');

async function start() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established');

    const server = app.listen(env.port, () => {
      console.log(`✓ API listening on http://localhost:${env.port} (${env.nodeEnv})`);
    });

    const shutdown = async (signal) => {
      console.log(`\n${signal} received, shutting down...`);
      server.close(async () => {
        await sequelize.close();
        process.exit(0);
      });
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error('✗ Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
