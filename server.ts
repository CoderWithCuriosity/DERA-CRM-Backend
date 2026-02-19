import dotenv from 'dotenv';
import app from './src/app';
import { sequelize } from './src/config/database';
import logger from './src/utils/logger';

// Load environment variables
dotenv.config();

interface ServerConfig {
    port: number;
    env: string;
}

const config: ServerConfig = {
    port: parseInt(process.env.PORT || '5000', 10),
    env: process.env.NODE_ENV || 'development'
};

const startServer = async (): Promise<void> => {
    try {
        // Database connection
        await sequelize.authenticate();
        logger.info('✅ Database connected successfully');

        // Sync database (in development)
        if (config.env === 'development') {
            await sequelize.sync({ alter: true });
            logger.info('📦 Database synced');
        }

        // Start server
        const server = app.listen(config.port, () => {
            logger.info(`🚀 Server running on port ${config.port}`);
            logger.info(`📊 Environment: ${config.env}`);
            logger.info(`📚 API Documentation: http://localhost:${config.port}/api-docs`);
        });

        // Graceful shutdown
        const shutdown = async (signal: string): Promise<void> => {
            logger.info(`📥 Received ${signal}, shutting down gracefully...`);
            
            server.close(async () => {
                logger.info('💤 HTTP server closed');
                
                try {
                    await sequelize.close();
                    logger.info('🗄️  Database connection closed');
                    process.exit(0);
                } catch (error) {
                    logger.error('❌ Error during shutdown:', error);
                    process.exit(1);
                }
            });

            // Force shutdown after timeout
            setTimeout(() => {
                logger.error('🚨 Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Handle uncaught errors
process.on('uncaughtException', (error: Error) => {
    logger.error('🚨 Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
    logger.error('🚨 Unhandled Rejection:', reason);
    process.exit(1);
});

startServer();