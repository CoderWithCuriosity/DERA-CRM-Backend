dera-crm-backend/
│
├── src/
│   ├── index.ts
│   ├── app.ts
│   │
│   ├── config/
│   │   ├── database.ts
│   │   ├── environment.ts
│   │   ├── constants.ts
│   │   ├── email.ts
│   │   ├── fileUpload.ts
│   │   └── rateLimit.ts
│   │
│   ├── models/
│   │   ├── index.ts
│   │   ├── User.ts
│   │   ├── Contact.ts
│   │   ├── Deal.ts
│   │   ├── Activity.ts
│   │   ├── Ticket.ts
│   │   ├── TicketComment.ts
│   │   ├── EmailTemplate.ts
│   │   ├── Campaign.ts
│   │   ├── CampaignRecipient.ts
│   │   ├── Organization.ts
│   │   ├── AuditLog.ts
│   │   ├── RefreshToken.ts
│   │   └── PasswordReset.ts
│   │
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── userController.ts
│   │   ├── contactController.ts
│   │   ├── dealController.ts
│   │   ├── activityController.ts
│   │   ├── ticketController.ts
│   │   ├── emailTemplateController.ts
│   │   ├── campaignController.ts
│   │   ├── dashboardController.ts
│   │   ├── adminController.ts
│   │   └── organizationController.ts
│   │
│   ├── routes/
│   │   ├── index.ts
│   │   ├── authRoutes.ts
│   │   ├── userRoutes.ts
│   │   ├── contactRoutes.ts
│   │   ├── dealRoutes.ts
│   │   ├── activityRoutes.ts
│   │   ├── ticketRoutes.ts
│   │   ├── emailTemplateRoutes.ts
│   │   ├── campaignRoutes.ts
│   │   ├── dashboardRoutes.ts
│   │   ├── adminRoutes.ts
│   │   └── organizationRoutes.ts
│   │
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── roleCheck.ts
│   │   ├── validation.ts
│   │   ├── errorHandler.ts
│   │   ├── rateLimiter.ts
│   │   ├── fileUpload.ts
│   │   ├── logger.ts
│   │   └── sanitizer.ts
│   │
│   ├── services/
│   │   ├── authService.ts
│   │   ├── emailService.ts
│   │   ├── tokenService.ts
│   │   ├── fileService.ts
│   │   ├── campaignService.ts
│   │   ├── dashboardService.ts
│   │   ├── slaService.ts
│   │   ├── auditService.ts
│   │   ├── exportService.ts
│   │   └── importService.ts
│   │
│   ├── utils/
│   │   ├── AppError.ts
│   │   ├── catchAsync.ts
│   │   ├── pagination.ts
│   │   ├── filters.ts
│   │   ├── validators/
│   │   │   ├── authValidators.ts
│   │   │   ├── userValidators.ts
│   │   │   ├── contactValidators.ts
│   │   │   ├── dealValidators.ts
│   │   │   ├── activityValidators.ts
│   │   │   ├── ticketValidators.ts
│   │   │   ├── emailTemplateValidators.ts
│   │   │   └── campaignValidators.ts
│   │   ├── helpers/
│   │   │   ├── dateHelpers.ts
│   │   │   ├── numberHelpers.ts
│   │   │   ├── stringHelpers.ts
│   │   │   ├── arrayHelpers.ts
│   │   │   └── objectHelpers.ts
│   │   ├── constants/
│   │   │   ├── roles.ts
│   │   │   ├── stages.ts
│   │   │   ├── priorities.ts
│   │   │   ├── statuses.ts
│   │   │   ├── activityTypes.ts
│   │   │   └── ticketStatuses.ts
│   │   └── templates/
│   │       ├── email/
│   │       │   ├── welcome.ejs
│   │       │   ├── verification.ejs
│   │       │   ├── passwordReset.ejs
│   │       │   ├── ticketAssigned.ejs
│   │       │   ├── ticketResolved.ejs
│   │       │   ├── dealAssigned.ejs
│   │       │   ├── campaignSummary.ejs
│   │       │   ├── weeklySummary.ejs
│   │       │   ├── slaBreach.ejs
│   │       │   └── dailyDigest.ejs
│   │       └── reports/
│   │           ├── salesReport.ejs
│   │           └── activityReport.ejs
│   │
│   ├── types/
│   │   ├── express.d.ts
│   │   ├── models.d.ts
│   │   ├── controllers.d.ts
│   │   ├── services.d.ts
│   │   └── middleware.d.ts
│   │
│   ├── jobs/
│   │   ├── index.ts
│   │   ├── backupJob.ts
│   │   ├── campaignScheduler.ts
│   │   ├── slaMonitor.ts
│   │   ├── dailyDigest.ts
│   │   ├── weeklySummary.ts
│   │   └── cleanupJob.ts
│   │
│   └── db/
│       ├── migrations/
│       │   ├── 20251101000000-create-users.js
│       │   ├── 20251101000001-create-organizations.js
│       │   ├── 20251101000002-create-contacts.js
│       │   ├── 20251101000003-create-deals.js
│       │   ├── 20251101000004-create-activities.js
│       │   ├── 20251101000005-create-tickets.js
│       │   ├── 20251101000006-create-ticket-comments.js
│       │   ├── 20251101000007-create-email-templates.js
│       │   ├── 20251101000008-create-campaigns.js
│       │   ├── 20251101000009-create-campaign-recipients.js
│       │   ├── 20251101000010-create-audit-logs.js
│       │   ├── 20251101000011-create-refresh-tokens.js
│       │   └── 20251101000012-create-password-resets.js
│       ├── seeders/
│       │   ├── 20251101000001-demo-users.js
│       │   ├── 20251101000002-demo-contacts.js
│       │   ├── 20251101000003-demo-deals.js
│       │   ├── 20251101000004-demo-tickets.js
│       │   └── 20251101000005-demo-email-templates.js
│       └── config/
│           └── config.js
│
├── uploads/
│   ├── avatars/
│   ├── logos/
│   ├── attachments/
│   ├── imports/
│   └── exports/
│
├── logs/
│   ├── error.log
│   ├── combined.log
│   └── exceptions.log
│
├── backups/
│
├── tests/
│   ├── unit/
│   │   ├── controllers/
│   │   │   ├── authController.test.ts
│   │   │   ├── userController.test.ts
│   │   │   ├── contactController.test.ts
│   │   │   ├── dealController.test.ts
│   │   │   ├── ticketController.test.ts
│   │   │   └── campaignController.test.ts
│   │   ├── services/
│   │   │   ├── authService.test.ts
│   │   │   ├── emailService.test.ts
│   │   │   ├── tokenService.test.ts
│   │   │   └── slaService.test.ts
│   │   ├── models/
│   │   │   ├── user.test.ts
│   │   │   ├── contact.test.ts
│   │   │   └── deal.test.ts
│   │   └── utils/
│   │       ├── pagination.test.ts
│   │       └── filters.test.ts
│   ├── integration/
│   │   ├── auth.test.ts
│   │   ├── contacts.test.ts
│   │   ├── deals.test.ts
│   │   ├── tickets.test.ts
│   │   └── campaigns.test.ts
│   ├── e2e/
│   │   ├── api.test.ts
│   │   └── workflows.test.ts
│   ├── fixtures/
│   │   ├── users.json
│   │   ├── contacts.json
│   │   ├── deals.json
│   │   └── tickets.json
│   └── setup/
│       ├── jest.setup.ts
│       └── testDatabase.ts
│
├── scripts/
│   ├── seed.ts
│   ├── migrate.ts
│   ├── createAdmin.ts
│   ├── backup.ts
│   └── restore.ts
│
├── docs/
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── CONTRIBUTING.md
│   └── postman/
│       ├── DERA-CRM.postman_collection.json
│       └── DERA-CRM.postman_environment.json
│
├── .env
├── .env.example
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── .sequelizerc
├── jest.config.js
├── tsconfig.json
├── package.json
├── package-lock.json
└── README.md