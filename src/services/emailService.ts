import nodemailer from 'nodemailer';
import ejs from 'ejs';
import path from 'path';
import { email as emailConfig } from '../config/environment';
import logger from '../config/logger';
import AppError from '../utils/AppError';
import { HTTP_STATUS } from '../config/constants';
import { v4 as uuidv4 } from 'uuid';

// Create transporter
const transporter = nodemailer.createTransport({
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure,
  auth: emailConfig.auth,
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production'
  }
});

// Verify connection
transporter.verify((error) => {
  if (error) {
    logger.error('Email transporter verification failed:', error);
  } else {
    logger.info('Email transporter ready');
  }
});

// Email queue
interface EmailJob {
  id: string;
  to: string;
  subject: string;
  template: string;
  data: any;
  attachments?: any[];
  retries: number;
  maxRetries: number;
}

class EmailQueue {
  private queue: EmailJob[] = [];
  private processing = false;
  private maxConcurrent = 5;
  private currentConcurrent = 0;

  async add(job: Omit<EmailJob, 'id' | 'retries'>): Promise<string> {
    const id = uuidv4();
    this.queue.push({
      id,
      ...job,
      retries: 0,
      maxRetries: 3
    });
    
    if (!this.processing) {
      this.process();
    }
    
    return id;
  }

  private async process() {
    this.processing = true;
    
    while (this.queue.length > 0 && this.currentConcurrent < this.maxConcurrent) {
      const job = this.queue.shift();
      if (job) {
        this.currentConcurrent++;
        this.sendEmail(job).finally(() => {
          this.currentConcurrent--;
        });
      }
    }
    
    if (this.queue.length > 0) {
      setTimeout(() => this.process(), 1000);
    } else {
      this.processing = false;
    }
  }

  private async sendEmail(job: EmailJob) {
    try {
      await sendEmailDirect(job);
      logger.info(`Email sent successfully: ${job.id}`);
    } catch (error) {
      if (job.retries < job.maxRetries) {
        job.retries++;
        logger.warn(`Retrying email ${job.id}, attempt ${job.retries}`);
        setTimeout(() => {
          this.queue.unshift(job);
          if (!this.processing) {
            this.process();
          }
        }, 5000 * job.retries); // Exponential backoff
      } else {
        logger.error(`Email failed after ${job.maxRetries} retries: ${job.id}`, error);
      }
    }
  }
}

const emailQueue = new EmailQueue();

/**
 * Render email template
 */
export const renderTemplate = async (template: string, data: any): Promise<string> => {
  try {
    const templatePath = path.join(__dirname, '../utils/templates/email', `${template}.ejs`);
    return await ejs.renderFile(templatePath, data);
  } catch (error) {
    logger.error('Error rendering email template:', error);
    throw new AppError('Failed to render email template', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Send email directly
 */
export const sendEmailDirect = async ({
  to,
  subject,
  template,
  data,
  attachments = []
}: {
  to: string;
  subject: string;
  template: string;
  data: any;
  attachments?: any[];
}): Promise<void> => {
  try {
    const html = await renderTemplate(template, data);

    const mailOptions = {
      from: `"${emailConfig.fromName}" <${emailConfig.from}>`,
      to,
      subject,
      html,
      attachments,
      replyTo: emailConfig.replyTo,
      headers: {
        'X-Application': 'DERA CRM',
        'X-Environment': process.env.NODE_ENV || 'development'
      }
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    logger.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Queue email for sending
 */
export const sendEmail = async (options: {
  to: string;
  subject: string;
  template: string;
  data: any;
  attachments?: any[];
}): Promise<string> => {
  return emailQueue.add(options);
};

/**
 * Send bulk emails
 */
export const sendBulkEmails = async (
  recipients: Array<{ to: string; data: any }>,
  subject: string,
  template: string
): Promise<string[]> => {
  const ids = await Promise.all(
    recipients.map(recipient =>
      sendEmail({
        to: recipient.to,
        subject,
        template,
        data: recipient.data
      })
    )
  );
  return ids;
};

/**
 * Send welcome email
 */
export const sendWelcomeEmail = async (user: any): Promise<void> => {
  await sendEmail({
    to: user.email,
    subject: 'Welcome to DERA CRM!',
    template: 'welcome',
    data: {
      first_name: user.first_name,
      company_name: 'DERA CRM',
      login_url: `${process.env.FRONTEND_URL}/login`
    }
  });
};

/**
 * Send ticket assignment email
 */
export const sendTicketAssignmentEmail = async (
  ticket: any,
  assignee: any,
  assignedBy: any
): Promise<void> => {
  await sendEmail({
    to: assignee.email,
    subject: `New Ticket Assigned: ${ticket.ticket_number}`,
    template: 'ticketAssigned',
    data: {
      first_name: assignee.first_name,
      ticket_number: ticket.ticket_number,
      subject: ticket.subject,
      priority: ticket.priority,
      assigned_by: `${assignedBy.first_name} ${assignedBy.last_name}`,
      ticket_url: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
    }
  });
};

/**
 * Send ticket resolution email
 */
export const sendTicketResolutionEmail = async (
  ticket: any,
  resolvedBy: any
): Promise<void> => {
  await sendEmail({
    to: ticket.contact.email,
    subject: `Ticket Resolved: ${ticket.ticket_number}`,
    template: 'ticketResolved',
    data: {
      first_name: ticket.contact.first_name,
      ticket_number: ticket.ticket_number,
      subject: ticket.subject,
      resolved_by: `${resolvedBy.first_name} ${resolvedBy.last_name}`,
      ticket_url: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
    }
  });
};

/**
 * Send deal assignment email
 */
export const sendDealAssignmentEmail = async (
  deal: any,
  assignee: any,
  assignedBy: any
): Promise<void> => {
  await sendEmail({
    to: assignee.email,
    subject: 'New Deal Assigned',
    template: 'dealAssigned',
    data: {
      first_name: assignee.first_name,
      deal_name: deal.name,
      contact_name: deal.contact?.fullName,
      amount: deal.amount,
      stage: deal.stage,
      assigned_by: `${assignedBy.first_name} ${assignedBy.last_name}`,
      deal_url: `${process.env.FRONTEND_URL}/deals/${deal.id}`
    }
  });
};

/**
 * Send campaign summary email
 */
export const sendCampaignSummaryEmail = async (
  campaign: any,
  recipient: any
): Promise<void> => {
  await sendEmail({
    to: recipient.email,
    subject: `Campaign Summary: ${campaign.name}`,
    template: 'campaignSummary',
    data: {
      first_name: recipient.first_name,
      campaign_name: campaign.name,
      sent_count: campaign.sent_count,
      open_count: campaign.open_count,
      click_count: campaign.click_count,
      open_rate: campaign.openRate.toFixed(2),
      click_rate: campaign.clickRate.toFixed(2),
      campaign_url: `${process.env.FRONTEND_URL}/campaigns/${campaign.id}`
    }
  });
};

/**
 * Send weekly summary email
 */
export const sendWeeklySummaryEmail = async (user: any, stats: any): Promise<void> => {
  await sendEmail({
    to: user.email,
    subject: 'Your Weekly DERA CRM Summary',
    template: 'weeklySummary',
    data: {
      first_name: user.first_name,
      ...stats
    }
  });
};

/**
 * Send SLA breach warning email
 */
export const sendSLABreachEmail = async (ticket: any, assignee: any): Promise<void> => {
  await sendEmail({
    to: assignee.email,
    subject: `URGENT: SLA Breach Warning - ${ticket.ticket_number}`,
    template: 'slaBreach',
    data: {
      first_name: assignee.first_name,
      ticket_number: ticket.ticket_number,
      subject: ticket.subject,
      priority: ticket.priority,
      due_date: ticket.due_date,
      ticket_url: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
    }
  });
};

/**
 * Send daily digest email
 */
export const sendDailyDigestEmail = async (user: any, digest: any): Promise<void> => {
  await sendEmail({
    to: user.email,
    subject: 'Your Daily DERA CRM Digest',
    template: 'dailyDigest',
    data: {
      first_name: user.first_name,
      ...digest
    }
  });
};

/**
 * Send user invitation email
 */
export const sendInvitationEmail = async (
  email: string,
  inviter: any,
  company: string,
  token: string
): Promise<void> => {
  const invitationUrl = `${process.env.FRONTEND_URL}/accept-invite?token=${token}`;
  
  await sendEmail({
    to: email,
    subject: `You've been invited to join ${company}`,
    template: 'userInvitation',
    data: {
      email,
      inviter_name: `${inviter.first_name} ${inviter.last_name}`,
      company_name: company,
      invitation_url: invitationUrl,
      expires_in: '7 days'
    }
  });
};

export default {
  sendEmail,
  sendBulkEmails,
  sendWelcomeEmail,
  sendTicketAssignmentEmail,
  sendTicketResolutionEmail,
  sendDealAssignmentEmail,
  sendCampaignSummaryEmail,
  sendWeeklySummaryEmail,
  sendSLABreachEmail,
  sendDailyDigestEmail,
  sendInvitationEmail
};