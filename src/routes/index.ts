import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import contactRoutes from './contactRoutes';
import dealRoutes from './dealRoutes';
import activityRoutes from './activityRoutes';
import ticketRoutes from './ticketRoutes';
import emailTemplateRoutes from './emailTemplateRoutes';
import campaignRoutes from './campaignRoutes';
import dashboardRoutes from './dashboardRoutes';
import adminRoutes from './adminRoutes';
import organizationRoutes from './organizationRoutes';
import messageRoutes from './messageRoutes';
import notificationRoutes from './notificationRoutes';
import { apiLimiter } from '../config/rateLimit';


const router = Router();

// Apply rate limiting to all routes
router.use(apiLimiter);

// Health check endpoint (no rate limit)
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'DERA CRM API',
    version: '1.0.0'
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/contacts', contactRoutes);
router.use('/deals', dealRoutes);
router.use('/activities', activityRoutes);
router.use('/tickets', ticketRoutes);
router.use('/email-templates', emailTemplateRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/admin', adminRoutes);
router.use('/organization', organizationRoutes);
router.use('/messages', messageRoutes);
router.use('/notifications', notificationRoutes);

// 404 handler for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  });
});

export default router;