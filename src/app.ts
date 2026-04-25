import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { environment, security } from './config/environment';
import routes from './routes';
import { errorHandler, notFound } from './middleware/errorHandler';
import { 
  xssProtection, 
  sqlInjectionProtection, 
  // securityHeaders,
  validateContentType 
} from './middleware/sanitizer';
import { addRequestId, logRequestStart, logRequestComplete } from './middleware/logger';
import logger from './config/logger';
import { setupAssociations } from './models';

/**
 * Initialize Express application
 */
const app: Application = express();

// Initialize associations
setupAssociations();

// ============================================================================
// Security Middleware
// ============================================================================

// Helmet for security headers
// if (security.helmetEnabled) {
//   app.use(securityHeaders);
// }

// CORS configuration
app.use(cors({
  origin: security.corsOrigin,
  credentials: security.corsCredentials,
  optionsSuccessStatus: 200
}));

// Request logging
app.use(addRequestId);
app.use(logRequestStart);

// HTTP request logger
if (environment.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.http(message.trim()) }
  }));
}

// ============================================================================
// Body Parsing Middleware
// ============================================================================

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// ============================================================================
// Security Middleware
// ============================================================================

// XSS Protection
app.use(xssProtection);

// SQL Injection Protection
app.use(sqlInjectionProtection);

// Content-Type validation for API routes
app.use(environment.apiPrefix, validateContentType);

// ============================================================================
// Static Files
// ============================================================================

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Serve public files
app.use('/public', express.static(path.join(process.cwd(), 'public')));

// ============================================================================
// API Routes
// ============================================================================

// Health check endpoint (no rate limit)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'DERA CRM API',
    version: '1.0.0',
    environment: environment.nodeEnv,
    uptime: process.uptime()
  });
});

// API routes
app.use(environment.apiPrefix, routes);

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Request completion logging
app.use(logRequestComplete);

export default app;