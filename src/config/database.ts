import { Sequelize, Options } from 'sequelize';
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

interface DatabaseConfig {
    name: string;
    user: string;
    password: string;
    host: string;
    port: number;
    dialect: 'postgres';
    logging: boolean | ((sql: string, timing?: number) => void);
    pool: {
        max: number;
        min: number;
        acquire: number;
        idle: number;
    };
}

const config: DatabaseConfig = {
    name: process.env.DB_NAME || 'dera_crm',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' 
        ? (sql: string) => logger.debug(sql) 
        : false,
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
};

const sequelizeOptions: Options = {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: config.logging,
    pool: config.pool,
    define: {
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    dialectOptions: {
        ssl: process.env.DB_SSL === 'true' ? {
            require: true,
            rejectUnauthorized: false
        } : false
    }
};

export const sequelize = new Sequelize(
    config.name,
    config.user,
    config.password,
    sequelizeOptions
);

export const testConnection = async (): Promise<void> => {
    try {
        await sequelize.authenticate();
        logger.info('Database connection has been established successfully.');
    } catch (error) {
        logger.error('Unable to connect to the database:', error);
        throw error;
    }
};

export const closeConnection = async (): Promise<void> => {
    try {
        await sequelize.close();
        logger.info('Database connection closed successfully.');
    } catch (error) {
        logger.error('Error closing database connection:', error);
        throw error;
    }
};

export default sequelize;