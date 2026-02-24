import dotenv from 'dotenv';
import { Server } from 'http';
import app from './app';
import sequelize from './config/database';
import { environment } from './config/environment';
import logger from './config/logger';
import { initializeJobs } from './jobs';
import { handleUnhandledRejection, handleUncaughtException } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

// Handle uncaught exceptions
handleUncaughtException();

let server: Server;

/**
 * Start server
 */
const startServer = async (): Promise<void> => {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');

    // Sync database (in development)
    if (environment.nodeEnv === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Database synced successfully');
    }

    // Initialize scheduled jobs
    initializeJobs();

    // Start server
    server = app.listen(environment.port, () => {
      logger.info(`
      ################################################
      🚀 Server listening on port: ${environment.port} 🚀
      🏠 Environment: ${environment.nodeEnv}
      📊 API URL: ${environment.serverUrl}${environment.apiPrefix}
      ################################################
      `);
    });

    // Handle unhandled rejections
    handleUnhandledRejection(server);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

/**
 * Graceful shutdown
 */
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      
      try {
        // Close database connection
        await sequelize.close();
        logger.info('Database connection closed.');
        
        logger.info('Graceful shutdown completed.');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    });

    // Force shutdown after timeout
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
startServer();

export default server;