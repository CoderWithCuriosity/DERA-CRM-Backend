import nodemailer from 'nodemailer';
import { email as emailConfig } from './environment';

// Create transporter
const transporter = nodemailer.createTransport({
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure,
  auth: emailConfig.auth,
  tls: {
    rejectUnauthorized: false // Only for development
  }
});

// Verify connection configuration
transporter.verify((error) => {
  if (error) {
    console.error('Email transporter verification failed:', error);
  } else {
    console.log('Email transporter ready');
  }
});

// Email templates configuration
export const emailTemplates = {
  welcome: {
    subject: 'Welcome to {{company_name}}!',
    template: 'welcome'
  },
  verification: {
    subject: 'Verify Your Email Address',
    template: 'verification'
  },
  passwordReset: {
    subject: 'Password Reset Request',
    template: 'passwordReset'
  },
  ticketAssigned: {
    subject: 'New Ticket Assigned: {{ticket_number}}',
    template: 'ticketAssigned'
  },
  ticketResolved: {
    subject: 'Ticket Resolved: {{ticket_number}}',
    template: 'ticketResolved'
  },
  dealAssigned: {
    subject: 'New Deal Assigned: {{deal_name}}',
    template: 'dealAssigned'
  },
  campaignSummary: {
    subject: 'Campaign Summary: {{campaign_name}}',
    template: 'campaignSummary'
  },
  weeklySummary: {
    subject: 'Your Weekly DERA CRM Summary',
    template: 'weeklySummary'
  },
  slaBreach: {
    subject: 'URGENT: SLA Breach Warning - {{ticket_number}}',
    template: 'slaBreach'
  },
  dailyDigest: {
    subject: 'Your Daily DERA CRM Digest',
    template: 'dailyDigest'
  }
} as const;

// Email queue configuration
export const emailQueue = {
  maxConcurrent: 5,
  retryAttempts: 3,
  retryDelay: 5000, // 5 seconds
  timeout: 30000 // 30 seconds
};

// Email rate limiting
export const emailRateLimit = {
  maxPerMinute: 100,
  maxPerHour: 1000,
  maxPerDay: 10000
};

// Email headers
export const emailHeaders = {
  'X-Application': 'DERA CRM',
  'X-Environment': process.env.NODE_ENV || 'development',
  'List-Unsubscribe': '<mailto:unsubscribe@deracrm.com>',
  'Precedence': 'bulk'
};

export default transporter;