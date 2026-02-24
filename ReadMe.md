# 📦 DERA CRM Backend - Complete Package Installation

Here's the updated package installation command with all test-related packages removed:

## 🚀 Installation Command 

```bash
npm install express sequelize pg pg-hstore jsonwebtoken bcryptjs dotenv cors helmet express-rate-limit express-validator multer sharp nodemailer ejs csv-parser csv-writer papaparse uuid winston morgan compression express-async-errors xss express-mongo-sanitize redis bull node-cron xlsx json2csv && npm install -D typescript ts-node nodemon eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser @types/node @types/express @types/sequelize @types/jsonwebtoken @types/bcryptjs @types/cors @types/multer @types/nodemailer @types/ejs @types/morgan @types/compression @types/uuid @types/node-cron @types/json2csv @types/papaparse @types/xlsx
```

## 📋 Complete Package List (Organized by Purpose)

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

### 🛠️ Dev Dependencies (Development Only)

| Package | Purpose |
|---------|---------|
| **typescript** | Static typing for JS - better scalability |
| **ts-node** | Run TypeScript directly - faster dev workflow |
| **nodemon** | Auto-restarts server on changes - hot reload |
| **eslint** | Code linting tool - finds errors & bad patterns |
| **@typescript-eslint/eslint-plugin** | ESLint rules for TypeScript - better TS code |
| **@typescript-eslint/parser** | Allows ESLint to read TS files - required for linting |
| **@types/node** | TypeScript types for Node.js |
| **@types/express** | TypeScript types for Express |
| **@types/sequelize** | TypeScript types for Sequelize |
| **@types/jsonwebtoken** | TypeScript types for JWT |
| **@types/bcryptjs** | TypeScript types for bcrypt |
| **@types/cors** | TypeScript types for CORS |
| **@types/multer** | TypeScript types for Multer |
| **@types/nodemailer** | TypeScript types for Nodemailer |
| **@types/ejs** | TypeScript types for EJS |
| **@types/morgan** | TypeScript types for Morgan |
| **@types/compression** | TypeScript types for Compression |
| **@types/uuid** | TypeScript types for UUID |
| **@types/node-cron** | TypeScript types for node-cron |
| **@types/json2csv** | TypeScript types for json2csv |
| **@types/papaparse** | TypeScript types for PapaParse |
| **@types/xlsx** | TypeScript types for XLSX |

## 📝 Removed Test Packages

The following test-related packages have been **removed** from the installation:

| Package | Purpose |
|---------|---------|
| ~~jest~~ | Testing framework |
| ~~@types/jest~~ | TypeScript types for Jest |
| ~~ts-jest~~ | Jest + TypeScript support |
| ~~supertest~~ | API testing tool |
| ~~@types/supertest~~ | TypeScript types for Supertest |

## 🎯 Package Installation Summary

```bash
# Total packages to install
# Production: 30 packages
# Development: 20 packages
# Total: 50 packages

# Installation size
# Production: ~80-100 MB
# Development: ~150-200 MB (including types)
# Total: ~250-300 MB
```

## 🔍 Why These Packages?

### Essential for CRM Functionality:
- **Database Layer**: Sequelize + PG for robust data management
- **Authentication**: JWT + bcrypt for secure user auth
- **File Handling**: Multer + Sharp for uploads and image processing
- **Email**: Nodemailer + EJS for all email communications
- **Data Import/Export**: CSV/Excel parsers and writers
- **Background Jobs**: Bull + Redis for campaign processing
- **Scheduling**: node-cron for automated tasks
- **Security**: Helmet, rate-limit, xss, sanitize for protection

### Development Experience:
- **TypeScript**: Full type safety
- **Linting**: ESLint for code quality
- **Hot Reload**: Nodemon for faster development

## 📦 Alternative: One-Line Installation

If you want to copy-paste the complete installation command:

```bash
npm install express sequelize pg pg-hstore jsonwebtoken bcryptjs dotenv cors helmet express-rate-limit express-validator multer sharp nodemailer ejs csv-parser csv-writer papaparse uuid winston morgan compression express-async-errors xss express-mongo-sanitize redis bull node-cron xlsx json2csv && npm install -D typescript ts-node nodemon eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser @types/node @types/express @types/sequelize @types/jsonwebtoken @types/bcryptjs @types/cors @types/multer @types/nodemailer @types/ejs @types/morgan @types/compression @types/uuid @types/node-cron @types/json2csv @types/papaparse @types/xlsx
```

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

# 4. Start development server
npm run dev

# 5. Build for production
npm run build
npm start
```