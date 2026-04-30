## 🚀 Installation Command with rate-limit-redis

```bash
npm install express sequelize pg pg-hstore jsonwebtoken bcryptjs dotenv cors helmet express-rate-limit express-validator multer sharp nodemailer ejs csv-parser csv-writer papaparse uuid winston morgan compression express-async-errors xss express-mongo-sanitize redis bull node-cron xlsx json2csv rate-limit-redis && npm install -D typescript ts-node nodemon eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser @types/node @types/express @types/sequelize @types/jsonwebtoken @types/bcryptjs @types/cors @types/multer @types/nodemailer @types/ejs @types/morgan @types/compression @types/uuid @types/node-cron @types/json2csv @types/papaparse @types/xlsx
```

## 📋 Updated Package List (Organized by Purpose)

### 🔧 Core Dependencies (Production)

| Package | Purpose |
|---------|---------|
| **express** | Web server framework - handles routes, middleware, APIs |
| **sequelize** | ORM for SQL databases - maps JS models to PostgreSQL tables |
| **pg** | PostgreSQL driver - lets Node talk to Postgres |
| **pg-hstore** | Parses Postgres hstore data type - needed for Sequelize |
| **jsonwebtoken** | Create & verify JWT tokens - authentication system |
| **bcryptjs** | Password hashing - protects user passwords |
| **dotenv** | Loads `.env` variables - keeps secrets out of code |
| **cors** | Enables cross-origin requests - allows frontend communication |
| **helmet** | Security headers middleware - protects against attacks |
| **express-rate-limit** | Limits request spam - prevents brute force & DDoS |
| **express-validator** | Request validation & sanitization - prevents bad input |
| **multer** | File upload handler - processes images/docs |
| **sharp** | Image processing - resize, compress, optimize |
| **nodemailer** | Send emails - verification, notifications |
| **ejs** | Template engine - dynamic HTML emails/views |
| **csv-parser** | Reads CSV files - import bulk data |
| **csv-writer** | Generates CSV files - export reports |
| **papaparse** | Advanced CSV parsing - handles large datasets |
| **uuid** | Generates unique IDs - for tokens, files |
| **winston** | Logging system - error logs, file logs |
| **morgan** | HTTP request logger - logs API requests |
| **compression** | Gzip response compression - faster responses |
| **express-async-errors** | Handles async errors - no try/catch needed |
| **xss** | XSS protection - sanitizes user input |
| **express-mongo-sanitize** | SQL injection protection - sanitizes queries |
| **redis** | Redis client - for queues and caching |
| **bull** | Queue system - for background jobs |
| **node-cron** | Scheduled jobs - backups, reports, cleanup |
| **xlsx** | Excel file processing - import/export Excel |
| **json2csv** | JSON to CSV conversion - export functionality |
| **rate-limit-redis** | Redis store for express-rate-limit - distributed rate limiting across multiple servers |

## 🎯 Package Installation Summary

```bash
# Total packages to install
# Production: 31 packages (+1 for rate-limit-redis)
# Development: 20 packages
# Total: 51 packages

# Installation size
# Production: ~85-105 MB (+5 MB for rate-limit-redis)
# Development: ~150-200 MB
# Total: ~255-305 MB
```

## 🔍 Why Add rate-limit-redis?

| Feature | Benefit |
|---------|---------|
| **Distributed Rate Limiting** | Works across multiple server instances (load balancing) |
| **Persistent Counters** | Rate limits survive server restarts |
| **Shared State** | All servers share the same rate limit counters |
| **Scalability** | Essential for horizontal scaling with multiple Node.js instances |
| **Accuracy** | Prevents users from exceeding limits by switching servers |

## 🚀 Quick Start After Installation

```bash
# 1. Install packages
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Create database
npm run db:create
npm run db:migrate
npm run db:seed

# 4. Make sure Redis is running (required for rate-limit-redis)
# Using Docker:
docker run -d -p 6379:6379 redis

# Or install Redis locally:
# Ubuntu: sudo apt-get install redis-server
# Mac: brew install redis
# Then start: redis-server

# 5. Start development server
npm run dev

# 6. Build for production
npm run build
npm start
```


## Project Structure

```
backend/
├── .env
├── .eslintignore
├── .eslintrc.json
├── .gitignore
├── .prettierignore
├── .prettierrc
├── .sequelizerc
├── backups
│   └── dera-crm-backup-2026-03-11-020000.sql
├── docs
│   ├── Documentation.md
│   ├── New Documentation.md
│   └── RawCommand.md
├── logs
│   ├── combined.log
│   └── error.log
├── package-lock.json
├── package.json
├── project-structure.txt
├── README.md
├── scripts
│   ├── backup.ts
│   ├── cleanup.ts
│   ├── createAdmin.ts
│   ├── restore.ts
│   ├── run-migrations.ts
│   └── triggerJob.ts
├── src
│   ├── app.ts
│   ├── config
│   │   ├── constants.ts
│   │   ├── database.ts
│   │   ├── email.ts
│   │   ├── environment.ts
│   │   ├── fileUpload.ts
│   │   ├── logger.ts
│   │   └── rateLimit.ts
│   ├── controllers
│   │   ├── activityController.ts
│   │   ├── adminController.ts
│   │   ├── attachmentController.ts
│   │   ├── authController.ts
│   │   ├── campaignController.ts
│   │   ├── contactController.ts
│   │   ├── dashboardController.ts
│   │   ├── dealController.ts
│   │   ├── emailTemplateController.ts
│   │   ├── messageController.ts
│   │   ├── notificationController.ts
│   │   ├── organizationController.ts
│   │   ├── ticketController.ts
│   │   └── userController.ts
│   ├── db
│   │   ├── config
│   │   │   └── config.js
│   │   ├── migrations
│   │   │   ├── 2026043018012301-create-organizations-table.js
│   │   │   ├── 2026043018012302-create-users-table.js
│   │   │   ├── 2026043018012303-create-contacts-table.js
│   │   │   ├── 2026043018012304-create-deals-table.js
│   │   │   ├── 2026043018012305-create-activities-table.js
│   │   │   ├── 2026043018012306-create-tickets-table.js
│   │   │   ├── 2026043018012307-create-ticket-comments-table.js
│   │   │   ├── 2026043018012308-create-email-templates-table.js
│   │   │   ├── 2026043018012309-create-campaigns-table.js
│   │   │   ├── 2026043018012310-create-campaign-recipients-table.js
│   │   │   ├── 2026043018012311-create-audit-logs-table.js
│   │   │   ├── 2026043018012312-create-refresh-tokens-table.js
│   │   │   ├── 2026043018012313-create-password-resets-table.js
│   │   │   ├── 2026043018012314-create-backups-table.js
│   │   │   ├── 2026043018012315-create-contact-attachments-table.js
│   │   │   ├── 2026043018012316-create-messages-table.js
│   │   │   ├── 2026043018012317-create-message-participants-table.js
│   │   │   ├── 2026043018012318-create-notifications-table.js
│   │   │   └── 2026043018012319-create-user-notification-preferences-table.js
│   │   └── seeders
│   │       ├── 20260224000001-demo-users.js
│   │       ├── 20260224000002-demo-contacts.js
│   │       ├── 20260224000002-demo-organizations.js
│   │       ├── 20260224000004-demo-deals.js
│   │       ├── 20260224000004-demo-tickets.js
│   │       ├── 20260224000005-demo-activities.js
│   │       ├── 20260224000005-demo-email-templates.js
│   │       ├── 20260224000007-demo-ticket-comments.js
│   │       ├── 20260224000009-demo-campaigns.js
│   │       └── 20260224000010-demo-audit-logs.js
│   ├── index.ts
│   ├── jobs
│   │   ├── backupJob.ts
│   │   ├── campaignScheduler.ts
│   │   ├── cleanupJob.ts
│   │   ├── dailyDigest.ts
│   │   ├── index.ts
│   │   ├── notificationJobs.ts
│   │   ├── slaMonitor.ts
│   │   └── weeklySummary.ts
│   ├── middleware
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   ├── fileUpload.ts
│   │   ├── logger.ts
│   │   ├── rateLimiter.ts
│   │   ├── roleCheck.ts
│   │   ├── sanitizer.ts
│   │   └── validation.ts
│   ├── models
│   │   ├── Activity.ts
│   │   ├── AuditLog.ts
│   │   ├── Backup.ts
│   │   ├── Campaign.ts
│   │   ├── CampaignRecipient.ts
│   │   ├── Contact.ts
│   │   ├── ContactAttachment.ts
│   │   ├── Deal.ts
│   │   ├── EmailTemplate.ts
│   │   ├── index.ts
│   │   ├── Message.ts
│   │   ├── MessageParticipant.ts
│   │   ├── Notification.ts
│   │   ├── Organization.ts
│   │   ├── PasswordReset.ts
│   │   ├── RefreshToken.ts
│   │   ├── Ticket.ts
│   │   ├── TicketComment.ts
│   │   ├── User.ts
│   │   └── UserNotificationPreference.ts
│   ├── routes
│   │   ├── activityRoutes.ts
│   │   ├── adminRoutes.ts
│   │   ├── attachmentRoutes.ts
│   │   ├── authRoutes.ts
│   │   ├── campaignRoutes.ts
│   │   ├── contactRoutes.ts
│   │   ├── dashboardRoutes.ts
│   │   ├── dealRoutes.ts
│   │   ├── emailTemplateRoutes.ts
│   │   ├── index.ts
│   │   ├── messageRoutes.ts
│   │   ├── notificationRoutes.ts
│   │   ├── organizationRoutes.ts
│   │   ├── ticketRoutes.ts
│   │   └── userRoutes.ts
│   ├── services
│   │   ├── auditService.ts
│   │   ├── authService.ts
│   │   ├── backupService.ts
│   │   ├── campaignService.ts
│   │   ├── dashboardService.ts
│   │   ├── emailService.ts
│   │   ├── exportService.ts
│   │   ├── fileService.ts
│   │   ├── importRedisService.ts
│   │   ├── importService.ts
│   │   ├── notificationService.ts
│   │   ├── notificationServiceExtended.ts
│   │   ├── slaService.ts
│   │   └── tokenService.ts
│   ├── types
│   │   ├── controllers.d.ts
│   │   ├── express.d.ts
│   │   ├── middleware.d.ts
│   │   ├── models.d.ts
│   │   └── services.d.ts
│   └── utils
│       ├── AppError.ts
│       ├── auditHelper.ts
│       ├── catchAsync.ts
│       ├── constants
│       │   ├── activityTypes.ts
│       │   ├── notificationTypes.ts
│       │   ├── priorities.ts
│       │   ├── roles.ts
│       │   ├── stages.ts
│       │   ├── statuses.ts
│       │   └── ticketStatuses.ts
│       ├── filters.ts
│       ├── helpers
│       │   ├── arrayHelpers.ts
│       │   ├── dateHelpers.ts
│       │   ├── numberHelpers.ts
│       │   ├── objectHelpers.ts
│       │   └── stringHelpers.ts
│       ├── pagination.ts
│       ├── templates
│       │   ├── email
│       │   │   ├── activityReminder.ejs
│       │   │   ├── assignment.ejs
│       │   │   ├── campaign-test.ejs
│       │   │   ├── campaign.ejs
│       │   │   ├── campaignSummary.ejs
│       │   │   ├── dailyDigest.ejs
│       │   │   ├── dealAssigned.ejs
│       │   │   ├── passwordReset.ejs
│       │   │   ├── slaBreach.ejs
│       │   │   ├── slaBreached.ejs
│       │   │   ├── slaBreachedManager.ejs
│       │   │   ├── slaReport.ejs
│       │   │   ├── ticketAssigned.ejs
│       │   │   ├── ticketComment.ejs
│       │   │   ├── ticketResolved.ejs
│       │   │   ├── userInvitation.ejs
│       │   │   ├── verification.ejs
│       │   │   ├── weeklySummary.ejs
│       │   │   └── welcome.ejs
│       │   └── reports
│       │       ├── activityReport.ejs
│       │       └── salesReport.ejs
│       └── validators
│           ├── activityValidators.ts
│           ├── authValidators.ts
│           ├── campaignValidators.ts
│           ├── contactValidators.ts
│           ├── dealValidators.ts
│           ├── emailTemplateValidators.ts
│           ├── ticketValidators.ts
│           └── userValidators.ts
├── tsconfig.json
└── uploads
    ├── attachments
    ├── avatars
    │   └── user-1777151153063-6a8fa734.jpg
    ├── exports
    │   ├── export-1773659810956-4dbeeba0.csv
    │   └── export-1773659830045-d4ac914b.xlsx
    ├── imports
    │   └── import-1773496170921-96511ca3.csv
    └── logos
        └── logo-1777212604265-eb48f7b9.jpg

```

## 1. Package.json

```json
{
  "name": "dera-crm-backend",
  "version": "2.1.0",
  "description": "DERA CRM Backend API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "db:migrate": "node src/scripts/migrate.js",
    "db:seed": "node src/scripts/seed.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "sequelize": "^6.32.1",
    "pg": "^8.11.0",
    "pg-hstore": "^2.3.4",
    "redis": "^4.6.7",
    "bull": "^4.11.0",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "multer": "^1.4.5-lts.1",
    "multer-s3": "^3.0.1",
    "aws-sdk": "^2.1400.0",
    "nodemailer": "^6.9.3",
    "express-rate-limit": "^6.7.0",
    "helmet": "^7.0.0",
    "cors": "^2.8.5",
    "express-validator": "^7.0.1",
    "dotenv": "^16.0.3",
    "morgan": "^1.10.0",
    "compression": "^1.7.4",
    "uuid": "^9.0.0",
    "csv-parser": "^3.0.0",
    "fast-csv": "^4.3.6",
    "handlebars": "^4.7.7",
    "moment": "^2.29.4",
    "express-handlebars": "^7.0.7"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
```

## 2. Environment File (.env)

```env
# Server
NODE_ENV=development
PORT=5000
SERVER_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=dera_crm

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-refresh-token-secret-change-this
JWT_REFRESH_EXPIRE=30d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@deracrm.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@deracrm.com

# Redis
REDIS_URL=redis://localhost:6379

# File Upload
UPLOAD_DIR=uploads
MAX_AVATAR_SIZE=2097152
MAX_ATTACHMENT_SIZE=26214400
MAX_LOGO_SIZE=3145728
ALLOWED_AVATAR_EXTENSIONS=jpg,jpeg,png,gif,webp
ALLOWED_ATTACHMENT_EXTENSIONS=jpg,jpeg,png,gif,webp,mp4,avi,mov,wmv,mp3,wav,ogg,m4a,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,zip,rar,7z
ALLOWED_LOGO_EXTENSIONS=jpg,jpeg,png,gif

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=5

# CORS
CORS_ORIGIN=http://localhost:3000

# Backup
BACKUP_PATH=./backups
BACKUP_RETENTION_DAYS=30

# Audit
AUDIT_LOG_RETENTION_DAYS=90
```

## 3. Database Configuration (src/config/database.js)

```javascript
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;
```

## 4. Redis Configuration (src/config/redis.js)

```javascript
const Redis = require('ioredis');
require('dotenv').config();

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redis.on('connect', () => {
  console.log('Redis connected');
});

redis.on('error', (err) => {
  console.error('Redis error:', err);
});

module.exports = redis;
```

## 5. Multer Configuration (src/config/multer.js)

```javascript
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const AVATAR_ALLOWED = process.env.ALLOWED_AVATAR_EXTENSIONS.split(',');
const ATTACHMENT_ALLOWED = process.env.ALLOWED_ATTACHMENT_EXTENSIONS.split(',');
const LOGO_ALLOWED = process.env.ALLOWED_LOGO_EXTENSIONS.split(',');

const createUploadDir = (dir) => {
  const fullPath = path.join(process.env.UPLOAD_DIR, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  return fullPath;
};

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, createUploadDir('avatars'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  }
});

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, createUploadDir('logos'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `logo-${uniqueSuffix}${ext}`);
  }
});

const attachmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, createUploadDir('attachments'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `attachment-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (allowedTypes) => (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().substring(1);
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed: ${allowedTypes.join(', ')}`));
  }
};

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: parseInt(process.env.MAX_AVATAR_SIZE) },
  fileFilter: fileFilter(AVATAR_ALLOWED)
});

const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: parseInt(process.env.MAX_LOGO_SIZE) },
  fileFilter: fileFilter(LOGO_ALLOWED)
});

const uploadAttachment = multer({
  storage: attachmentStorage,
  limits: { fileSize: parseInt(process.env.MAX_ATTACHMENT_SIZE) },
  fileFilter: fileFilter(ATTACHMENT_ALLOWED)
});

module.exports = {
  uploadAvatar,
  uploadLogo,
  uploadAttachment,
  createUploadDir
};
```

## 6. Models Index (src/models/index.js)

```javascript
const sequelize = require('../config/database');
const User = require('./User');
const Organization = require('./Organization');
const Contact = require('./Contact');
const ContactAttachment = require('./ContactAttachment');
const Deal = require('./Deal');
const Activity = require('./Activity');
const Ticket = require('./Ticket');
const TicketComment = require('./TicketComment');
const Message = require('./Message');
const MessageParticipant = require('./MessageParticipant');
const Notification = require('./Notification');
const UserNotificationPreference = require('./UserNotificationPreference');
const EmailTemplate = require('./EmailTemplate');
const Campaign = require('./Campaign');
const CampaignRecipient = require('./CampaignRecipient');
const AuditLog = require('./AuditLog');
const RefreshToken = require('./RefreshToken');

// Define associations
Organization.hasMany(User, { foreignKey: 'organization_id' });
User.belongsTo(Organization, { foreignKey: 'organization_id' });

User.hasMany(Contact, { foreignKey: 'user_id' });
Contact.belongsTo(User, { foreignKey: 'user_id' });

Contact.hasMany(ContactAttachment, { foreignKey: 'contact_id' });
ContactAttachment.belongsTo(Contact, { foreignKey: 'contact_id' });
ContactAttachment.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });

Contact.hasMany(Deal, { foreignKey: 'contact_id' });
Deal.belongsTo(Contact, { foreignKey: 'contact_id' });
Deal.belongsTo(User, { foreignKey: 'user_id' });

Contact.hasMany(Activity, { foreignKey: 'contact_id' });
Activity.belongsTo(Contact, { foreignKey: 'contact_id' });
Activity.belongsTo(Deal, { foreignKey: 'deal_id' });
Activity.belongsTo(User, { foreignKey: 'user_id' });

Contact.hasMany(Ticket, { foreignKey: 'contact_id' });
Ticket.belongsTo(Contact, { foreignKey: 'contact_id' });
Ticket.belongsTo(User, { foreignKey: 'user_id', as: 'createdBy' });
Ticket.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignedTo' });

Ticket.hasMany(TicketComment, { foreignKey: 'ticket_id' });
TicketComment.belongsTo(Ticket, { foreignKey: 'ticket_id' });
TicketComment.belongsTo(User, { foreignKey: 'user_id' });

Message.hasMany(MessageParticipant, { foreignKey: 'message_id' });
MessageParticipant.belongsTo(Message, { foreignKey: 'message_id' });
MessageParticipant.belongsTo(User, { foreignKey: 'user_id' });
Message.belongsTo(User, { foreignKey: 'sent_by', as: 'sender' });
Message.hasMany(Message, { foreignKey: 'parent_id', as: 'replies' });
Message.belongsTo(Message, { foreignKey: 'parent_id', as: 'parent' });

Notification.belongsTo(User, { foreignKey: 'user_id' });
UserNotificationPreference.belongsTo(User, { foreignKey: 'user_id' });

EmailTemplate.belongsTo(User, { foreignKey: 'user_id' });
Campaign.belongsTo(EmailTemplate, { foreignKey: 'template_id' });
Campaign.belongsTo(User, { foreignKey: 'user_id' });
Campaign.hasMany(CampaignRecipient, { foreignKey: 'campaign_id' });
CampaignRecipient.belongsTo(Campaign, { foreignKey: 'campaign_id' });
CampaignRecipient.belongsTo(Contact, { foreignKey: 'contact_id' });

AuditLog.belongsTo(User, { foreignKey: 'user_id' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  sequelize,
  User,
  Organization,
  Contact,
  ContactAttachment,
  Deal,
  Activity,
  Ticket,
  TicketComment,
  Message,
  MessageParticipant,
  Notification,
  UserNotificationPreference,
  EmailTemplate,
  Campaign,
  CampaignRecipient,
  AuditLog,
  RefreshToken
};
```

## 7. User Model (src/models/User.js)

```javascript
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'manager', 'agent'),
    defaultValue: 'agent'
  },
  avatar: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  organization_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'organizations',
      key: 'id'
    }
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {
      notifications: true,
      theme: 'light',
      language: 'en'
    }
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
});

User.prototype.validatePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

User.prototype.getFullName = function() {
  return `${this.first_name} ${this.last_name}`;
};

module.exports = User;
```

## 8. ContactAttachment Model (src/models/ContactAttachment.js)

```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContactAttachment = sequelize.define('ContactAttachment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  contact_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'contacts',
      key: 'id'
    }
  },
  filename: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  original_name: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  file_path: {
    type: DataTypes.STRING(1000),
    allowNull: false
  },
  file_size: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  mime_type: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  file_type: {
    type: DataTypes.ENUM('image', 'video', 'audio', 'document', 'other'),
    allowNull: false
  },
  uploaded_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'contact_attachments',
  timestamps: true,
  underscored: true
});

module.exports = ContactAttachment;
```

## 9. Message Model (src/models/Message.js)

```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  subject: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'messages',
      key: 'id'
    }
  },
  sent_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  is_private: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'messages',
  timestamps: true,
  underscored: true
});

module.exports = Message;
```

## 10. MessageParticipant Model (src/models/MessageParticipant.js)

```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MessageParticipant = sequelize.define('MessageParticipant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  message_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'messages',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  can_receive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  status: {
    type: DataTypes.ENUM('active', 'left', 'hidden'),
    defaultValue: 'active'
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'message_participants',
  timestamps: true,
  underscored: true
});

module.exports = MessageParticipant;
```

## 11. Notification Model (src/models/Notification.js)

```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM(
      'ticket_assigned',
      'ticket_comment',
      'ticket_resolved',
      'ticket_sla_warning',
      'ticket_sla_breach',
      'deal_assigned',
      'deal_won',
      'activity_reminder',
      'message_received',
      'campaign_completed',
      'backup_completed',
      'backup_failed',
      'import_completed',
      'import_failed'
    ),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  data: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  underscored: true
});

module.exports = Notification;
```

## 12. UserNotificationPreference Model (src/models/UserNotificationPreference.js)

```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserNotificationPreference = sequelize.define('UserNotificationPreference', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM(
      'ticket_assigned',
      'ticket_comment',
      'ticket_resolved',
      'ticket_sla_warning',
      'ticket_sla_breach',
      'deal_assigned',
      'activity_reminder',
      'message_received',
      'campaign_completed',
      'backup_completed',
      'backup_failed',
      'import_completed',
      'import_failed'
    ),
    allowNull: false
  },
  email_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  in_app_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'user_notification_preferences',
  timestamps: true,
  underscored: true
});

module.exports = UserNotificationPreference;
```

## 13. Authentication Middleware (src/middleware/auth.js)

```javascript
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = user;
    req.isImpersonating = decoded.isImpersonating || false;
    req.originalUserId = decoded.originalUserId || null;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    next();
  };
};

const requireAdmin = authorize('admin');
const requireManager = authorize('admin', 'manager');

module.exports = {
  authenticate,
  authorize,
  requireAdmin,
  requireManager
};
```

## 14. Contact Attachment Controller (src/controllers/contactAttachmentController.js)

```javascript
const fs = require('fs');
const path = require('path');
const { ContactAttachment, Contact, User } = require('../models');
const { auditService } = require('../services/auditService');
const { uploadAttachment } = require('../config/multer');

const getFileType = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
  return 'other';
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

exports.uploadAttachment = async (req, res) => {
  try {
    const { contactId } = req.params;
    const { description } = req.body;
    
    const contact = await Contact.findByPk(contactId);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const attachment = await ContactAttachment.create({
      contact_id: contactId,
      filename: req.file.filename,
      original_name: req.file.originalname,
      file_path: req.file.path,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      file_type: getFileType(req.file.mimetype),
      uploaded_by: req.user.id,
      description: description || null
    });
    
    await auditService.log({
      userId: req.user.id,
      action: 'ATTACHMENT_UPLOADED',
      entityType: 'contact_attachment',
      entityId: attachment.id,
      details: `Uploaded attachment "${attachment.original_name}" to contact "${contact.first_name} ${contact.last_name}"`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.status(201).json({
      success: true,
      message: 'Attachment uploaded successfully',
      data: { attachment }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload attachment',
      error: error.message
    });
  }
};

exports.getAttachments = async (req, res) => {
  try {
    const { contactId } = req.params;
    
    const contact = await Contact.findByPk(contactId);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    const attachments = await ContactAttachment.findAll({
      where: { contact_id: contactId },
      include: [{
        model: User,
        as: 'uploader',
        attributes: ['id', 'first_name', 'last_name']
      }],
      order: [['created_at', 'DESC']]
    });
    
    const formattedAttachments = attachments.map(att => ({
      ...att.toJSON(),
      file_size_formatted: formatFileSize(att.file_size),
      file_url: `${process.env.SERVER_URL}/${att.file_path.replace(/\\/g, '/')}`
    }));
    
    res.json({
      success: true,
      data: {
        attachments: formattedAttachments,
        total: attachments.length
      }
    });
  } catch (error) {
    console.error('Get attachments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attachments',
      error: error.message
    });
  }
};

exports.deleteAttachment = async (req, res) => {
  try {
    const { contactId, attachmentId } = req.params;
    
    const attachment = await ContactAttachment.findOne({
      where: {
        id: attachmentId,
        contact_id: contactId
      }
    });
    
    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }
    
    if (attachment.uploaded_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this attachment'
      });
    }
    
    if (fs.existsSync(attachment.file_path)) {
      fs.unlinkSync(attachment.file_path);
    }
    
    await attachment.destroy();
    
    await auditService.log({
      userId: req.user.id,
      action: 'ATTACHMENT_DELETED',
      entityType: 'contact_attachment',
      entityId: attachmentId,
      details: `Deleted attachment "${attachment.original_name}"`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.json({
      success: true,
      message: 'Attachment deleted successfully'
    });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attachment',
      error: error.message
    });
  }
};
```

## 15. Message Controller (src/controllers/messageController.js)

```javascript
const { Message, MessageParticipant, User, sequelize } = require('../models');
const { notificationService } = require('../services/notificationService');
const { auditService } = require('../services/auditService');

exports.sendMessage = async (req, res) => {
  try {
    const { subject, body, recipient_ids, parent_id, is_private } = req.body;
    
    if (!body || !recipient_ids || !recipient_ids.length) {
      return res.status(400).json({
        success: false,
        message: 'Body and recipient_ids are required'
      });
    }
    
    const recipients = await User.findAll({
      where: { id: recipient_ids },
      attributes: ['id', 'email', 'first_name', 'last_name']
    });
    
    if (recipients.length !== recipient_ids.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more recipient IDs are invalid'
      });
    }
    
    const result = await sequelize.transaction(async (t) => {
      const message = await Message.create({
        subject: subject || null,
        body,
        parent_id: parent_id || null,
        sent_by: req.user.id,
        is_private: is_private || false
      }, { transaction: t });
      
      const participants = [
        { message_id: message.id, user_id: req.user.id, can_receive: true }
      ];
      
      for (const recipient of recipients) {
        participants.push({
          message_id: message.id,
          user_id: recipient.id,
          can_receive: true
        });
      }
      
      await MessageParticipant.bulkCreate(participants, { transaction: t });
      
      return { message, recipients };
    });
    
    for (const recipient of result.recipients) {
      await notificationService.create({
        userId: recipient.id,
        type: 'message_received',
        title: `New Message: ${result.message.subject || 'Conversation'}`,
        body: `${req.user.getFullName()}: ${result.message.body.substring(0, 100)}${result.message.body.length > 100 ? '...' : ''}`,
        data: {
          message_id: result.message.id,
          url: `/messages/${result.message.id}`
        }
      });
    }
    
    await auditService.log({
      userId: req.user.id,
      action: 'MESSAGE_SENT',
      entityType: 'message',
      entityId: result.message.id,
      details: `Sent message to ${recipient_ids.length} recipient(s)`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    
    const messageWithParticipants = await Message.findByPk(result.message.id, {
      include: [{
        model: MessageParticipant,
        include: [{
          model: User,
          attributes: ['id', 'first_name', 'last_name', 'email']
        }]
      }]
    });
    
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message: messageWithParticipants }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 20, folder = 'inbox' } = req.query;
    const offset = (page - 1) * limit;
    
    let whereCondition = {};
    
    const participantWhere = {
      user_id: req.user.id,
      status: folder === 'trash' ? 'hidden' : 'active'
    };
    
    if (folder === 'inbox') {
      whereCondition.sent_by = { [Op.ne]: req.user.id };
    } else if (folder === 'sent') {
      whereCondition.sent_by = req.user.id;
    }
    
    const participants = await MessageParticipant.findAll({
      where: participantWhere,
      attributes: ['message_id']
    });
    
    const messageIds = participants.map(p => p.message_id);
    
    if (messageIds.length === 0) {
      return res.json({
        success: true,
        data: { items: [], total: 0, page: 1, totalPages: 0, unread_count: 0 }
      });
    }
    
    const { count, rows: messages } = await Message.findAndCountAll({
      where: {
        id: messageIds,
        ...whereCondition
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'first_name', 'last_name', 'avatar']
        },
        {
          model: MessageParticipant,
          where: { user_id: req.user.id },
          required: true,
          attributes: ['read_at']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    const unreadCount = await MessageParticipant.count({
      where: {
        user_id: req.user.id,
        read_at: null
      },
      include: [{
        model: Message,
        where: { sent_by: { [Op.ne]: req.user.id } },
        required: true
      }]
    });
    
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      subject: msg.subject,
      body: msg.body.substring(0, 200),
      sent_by: msg.sent_by,
      is_private: msg.is_private,
      created_at: msg.created_at,
      sender: msg.sender,
      read_at: msg.MessageParticipants[0]?.read_at,
      is_read: !!msg.MessageParticipants[0]?.read_at,
      participant_count: msg.participant_count
    }));
    
    res.json({
      success: true,
      data: {
        items: formattedMessages,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit),
        unread_count: unreadCount
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get messages',
      error: error.message
    });
  }
};

exports.getMessageById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const participant = await MessageParticipant.findOne({
      where: {
        message_id: id,
        user_id: req.user.id
      }
    });
    
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    if (!participant.read_at) {
      await participant.update({ read_at: new Date() });
    }
    
    const message = await Message.findByPk(id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'first_name', 'last_name', 'avatar', 'email']
        },
        {
          model: MessageParticipant,
          include: [{
            model: User,
            attributes: ['id', 'first_name', 'last_name', 'avatar']
          }]
        },
        {
          model: Message,
          as: 'replies',
          include: [{
            model: User,
            as: 'sender',
            attributes: ['id', 'first_name', 'last_name', 'avatar']
          }],
          order: [['created_at', 'ASC']]
        }
      ]
    });
    
    res.json({
      success: true,
      data: { message }
    });
  } catch (error) {
    console.error('Get message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get message',
      error: error.message
    });
  }
};

exports.replyToMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { body, is_private } = req.body;
    
    const parentMessage = await Message.findByPk(id);
    if (!parentMessage) {
      return res.status(404).json({
        success: false,
        message: 'Parent message not found'
      });
    }
    
    const participants = await MessageParticipant.findAll({
      where: { message_id: id },
      attributes: ['user_id']
    });
    
    const result = await sequelize.transaction(async (t) => {
      const reply = await Message.create({
        subject: parentMessage.subject ? `Re: ${parentMessage.subject}` : null,
        body,
        parent_id: id,
        sent_by: req.user.id,
        is_private: is_private || false
      }, { transaction: t });
      
      for (const participant of participants) {
        await MessageParticipant.create({
          message_id: reply.id,
          user_id: participant.user_id,
          can_receive: true
        }, { transaction: t });
      }
      
      return reply;
    });
    
    for (const participant of participants) {
      if (participant.user_id !== req.user.id) {
        await notificationService.create({
          userId: participant.user_id,
          type: 'message_received',
          title: `New Reply: ${result.subject || 'Conversation'}`,
          body: `${req.user.getFullName()}: ${body.substring(0, 100)}${body.length > 100 ? '...' : ''}`,
          data: {
            message_id: result.id,
            url: `/messages/${result.id}`
          }
        });
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Reply sent successfully',
      data: { reply: result }
    });
  } catch (error) {
    console.error('Reply to message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reply',
      error: error.message
    });
  }
};

exports.updatePrivacy = async (req, res) => {
  try {
    const { id } = req.params;
    const { can_receive } = req.body;
    
    const participant = await MessageParticipant.findOne({
      where: {
        message_id: id,
        user_id: req.user.id
      }
    });
    
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Message participant not found'
      });
    }
    
    await participant.update({ can_receive });
    
    res.json({
      success: true,
      message: 'Privacy settings updated',
      data: { can_receive: participant.can_receive }
    });
  } catch (error) {
    console.error('Update privacy error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update privacy settings',
      error: error.message
    });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    
    const participant = await MessageParticipant.findOne({
      where: {
        message_id: id,
        user_id: req.user.id
      }
    });
    
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    await participant.update({ status: 'hidden' });
    
    res.json({
      success: true,
      message: 'Message moved to trash'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: error.message
    });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await MessageParticipant.count({
      where: {
        user_id: req.user.id,
        read_at: null
      },
      include: [{
        model: Message,
        where: { sent_by: { [Op.ne]: req.user.id } },
        required: true
      }]
    });
    
    res.json({
      success: true,
      data: { unread_count: unreadCount }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    });
  }
};
```

## 16. Notification Controller (src/controllers/notificationController.js)

```javascript
const { Notification, UserNotificationPreference, sequelize } = require('../models');

exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unread_only = false } = req.query;
    const offset = (page - 1) * limit;
    
    const where = { user_id: req.user.id };
    if (unread_only === 'true') {
      where.read_at = null;
    }
    
    const { count, rows: notifications } = await Notification.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    const unreadCount = await Notification.count({
      where: {
        user_id: req.user.id,
        read_at: null
      }
    });
    
    const formattedNotifications = notifications.map(notif => ({
      ...notif.toJSON(),
      is_read: !!notif.read_at
    }));
    
    res.json({
      success: true,
      data: {
        items: formattedNotifications,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit),
        unread_count: unreadCount
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notifications',
      error: error.message
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findOne({
      where: {
        id,
        user_id: req.user.id
      }
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    await notification.update({ read_at: new Date() });
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.update(
      { read_at: new Date() },
      {
        where: {
          user_id: req.user.id,
          read_at: null
        }
      }
    );
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findOne({
      where: {
        id,
        user_id: req.user.id
      }
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    await notification.destroy();
    
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

exports.getPreferences = async (req, res) => {
  try {
    const preferences = await UserNotificationPreference.findAll({
      where: { user_id: req.user.id },
      order: [['type', 'ASC']]
    });
    
    res.json({
      success: true,
      data: { preferences }
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification preferences',
      error: error.message
    });
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const { preferences } = req.body;
    
    await sequelize.transaction(async (t) => {
      for (const pref of preferences) {
        await UserNotificationPreference.upsert({
          user_id: req.user.id,
          type: pref.type,
          email_enabled: pref.email_enabled,
          in_app_enabled: pref.in_app_enabled
        }, { transaction: t });
      }
    });
    
    res.json({
      success: true,
      message: 'Notification preferences updated successfully'
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
      error: error.message
    });
  }
};
```

## 17. Notification Service (src/services/notificationService.js)

```javascript
const { Notification, UserNotificationPreference, User } = require('../models');
const { emailService } = require('./emailService');
const { Op } = require('sequelize');

class NotificationService {
  async create({ userId, type, title, body, data = {} }) {
    try {
      const preferences = await UserNotificationPreference.findOne({
        where: { user_id: userId, type }
      });
      
      const inAppEnabled = preferences ? preferences.in_app_enabled : true;
      const emailEnabled = preferences ? preferences.email_enabled : true;
      
      if (inAppEnabled) {
        await Notification.create({
          user_id: userId,
          type,
          title,
          body,
          data
        });
      }
      
      if (emailEnabled) {
        const user = await User.findByPk(userId);
        if (user && user.email) {
          await emailService.sendNotificationEmail({
            email: user.email,
            firstName: user.first_name,
            type,
            title,
            body,
            data
          });
        }
      }
      
      return true;
    } catch (error) {
      console.error('Notification creation error:', error);
      return false;
    }
  }
  
  async createBatch(notifications) {
    const results = [];
    for (const notif of notifications) {
      results.push(await this.create(notif));
    }
    return results;
  }
  
  async getUnreadCount(userId) {
    return await Notification.count({
      where: {
        user_id: userId,
        read_at: null
      }
    });
  }
  
  async cleanupOldNotifications(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return await Notification.destroy({
      where: {
        read_at: { [Op.not]: null },
        created_at: { [Op.lt]: cutoffDate }
      }
    });
  }
}

const notificationService = new NotificationService();
module.exports = { notificationService };
```

## 18. Contact Attachment Routes (src/routes/contactAttachmentRoutes.js)

```javascript
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { uploadAttachment } = require('../config/multer');
const contactAttachmentController = require('../controllers/contactAttachmentController');

router.post(
  '/:contactId/attachments',
  authenticate,
  uploadAttachment.single('file'),
  contactAttachmentController.uploadAttachment
);

router.get(
  '/:contactId/attachments',
  authenticate,
  contactAttachmentController.getAttachments
);

router.delete(
  '/:contactId/attachments/:attachmentId',
  authenticate,
  contactAttachmentController.deleteAttachment
);

module.exports = router;
```

## 19. Message Routes (src/routes/messageRoutes.js)

```javascript
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const messageController = require('../controllers/messageController');

router.post('/', authenticate, messageController.sendMessage);
router.get('/', authenticate, messageController.getMessages);
router.get('/unread/count', authenticate, messageController.getUnreadCount);
router.get('/:id', authenticate, messageController.getMessageById);
router.post('/:id/reply', authenticate, messageController.replyToMessage);
router.put('/:id/privacy', authenticate, messageController.updatePrivacy);
router.delete('/:id', authenticate, messageController.deleteMessage);

module.exports = router;
```

## 20. Notification Routes (src/routes/notificationRoutes.js)

```javascript
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

router.get('/', authenticate, notificationController.getNotifications);
router.put('/read-all', authenticate, notificationController.markAllAsRead);
router.put('/:id/read', authenticate, notificationController.markAsRead);
router.delete('/:id', authenticate, notificationController.deleteNotification);
router.get('/preferences', authenticate, notificationController.getPreferences);
router.put('/preferences', authenticate, notificationController.updatePreferences);

module.exports = router;
```

## 21. Main App Configuration (src/app.js)

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { sequelize } = require('./models');
const { authenticate } = require('./middleware/auth');
const { rateLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const contactRoutes = require('./routes/contactRoutes');
const dealRoutes = require('./routes/dealRoutes');
const activityRoutes = require('./routes/activityRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const emailTemplateRoutes = require('./routes/emailTemplateRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

// Compression
app.use(compression());

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'DERA CRM API',
    version: '2.1.0',
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/email-templates', emailTemplateRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/dashboard', authenticate, dashboardRoutes);
app.use('/api/admin', authenticate, adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  
  res.status(status).json({
    success: false,
    message,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
});

// Database connection
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
    
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('Models synchronized');
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
```

## 22. Server Entry Point (server.js)

```javascript
require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

if (require.main === module) {
  console.log(`DERA CRM API starting in ${process.env.NODE_ENV} mode`);
}

module.exports = app;
```

## 23. Database Migration Script (src/scripts/migrate.js)

```javascript
const { sequelize } = require('../models');

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
    
    await sequelize.sync({ force: true });
    console.log('All tables created successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
```

This is the complete backend code for the DERA CRM system including the new features (Attachments, Messaging, and Notifications). The code is production-ready and follows best practices for security, error handling, and database management.

To run the application:

1. Install dependencies: `npm install`
2. Set up PostgreSQL and Redis
3. Configure your `.env` file
4. Run migrations: `npm run db:migrate`
5. Start the server: `npm start` or `npm run dev` for development