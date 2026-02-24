import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

interface DatabaseConfig {
  database: string;
  username: string;
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
  database: process.env.DB_NAME || 'dera_crm',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000
  }
};

// Environment specific configurations
const envConfigs = {
  development: {
    ...config,
    logging: console.log
  },
  test: {
    ...config,
    database: process.env.DB_NAME_TEST || 'dera_crm_test',
    logging: false
  },
  production: {
    ...config,
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 20000
    }
  }
};

const environment = process.env.NODE_ENV || 'development';
const sequelize = new Sequelize(envConfigs[environment as keyof typeof envConfigs]);

export default sequelize;
export { config, envConfigs };