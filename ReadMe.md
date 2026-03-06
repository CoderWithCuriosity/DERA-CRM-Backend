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