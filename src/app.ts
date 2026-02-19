import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import 'express-async-errors';

import { sequelize } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import logger from './utils/logger';
import { ApiResponse, HealthCheckResponse } from './types/responses';

// Import routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import contactRoutes from './routes/contactRoutes';
import dealRoutes from './routes/dealRoutes';
import activityRoutes from './routes/activityRoutes';
import ticketRoutes from './routes/ticketRoutes';
import emailRoutes from './routes/emailRoutes';
import campaignRoutes from './routes/campaignRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import adminRoutes from './routes/adminRoutes';
import organizationRoutes from './routes/organizationRoutes';

const app: Application = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined', { 
    stream: { 
        write: (message: string) => logger.info(message.trim()) 
    } 
}));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { 
        success: false, 
        message: 'Too many requests, please try again later.' 
    } as ApiResponse,
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { 
        success: false, 
        message: 'Too many authentication attempts, please try again later.' 
    } as ApiResponse,
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting
app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/email-templates', emailRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/organization', organizationRoutes);

// Health check
app.get('/health', async (_req: Request, res: Response<ApiResponse<HealthCheckResponse>>) => {
    const dbStatus = await sequelize.authenticate()
        .then(() => 'connected' as const)
        .catch(() => 'disconnected' as const);

    const memoryUsage = process.memoryUsage();

    res.json({
        success: true,
        data: {
            status: 'ok',
            success: true,
            timestamp: new Date().toISOString(),
            service: 'Dera CRM API',
            version: '1.0.0',
            database: dbStatus,
            uptime: process.uptime(),
            memory: {
                heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100} MB`,
                heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100} MB`
            }
        }
    });
});

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    } as ApiResponse);
});

// Error handler
app.use(errorHandler);

export default app;