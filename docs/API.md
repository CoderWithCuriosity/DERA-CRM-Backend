## `docs/API.md`

```markdown
# DERA CRM Backend API Documentation

## Table of Contents
1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Endpoints](#endpoints)
   - [Authentication](#authentication-endpoints)
   - [Users & Profile](#users--profile-endpoints)
   - [Contacts](#contacts-endpoints)
   - [Deals & Sales Pipeline](#deals--sales-pipeline-endpoints)
   - [Activities](#activities-endpoints)
   - [Support Tickets](#support-tickets-endpoints)
   - [Email Marketing](#email-marketing-endpoints)
   - [Dashboard](#dashboard-endpoints)
   - [Administration](#administration-endpoints)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [Real-time Updates](#real-time-updates)

## API Overview

**Base URL:** `http://localhost:5000/api` (Development)  
**Production URL:** `https://api.deracrm.com/api`

**Content-Type:** `application/json`  
**Authentication:** Bearer Token

### Example Base Request
```javascript
const baseURL = process.env.NODE_ENV === 'production' 
  ? 'https://api.deracrm.com/api' 
  : 'http://localhost:5000/api';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};
```

## Authentication

### JWT Token
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Structure
```json
{
  "userId": 1,
  "email": "user@example.com",
  "role": "admin",
  "iat": 1516239022,
  "exp": 1516242622
}
```

## Endpoints

### Authentication Endpoints

#### 1. Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for verification.",
  "data": {
    "user": {
      "id": 1,
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "agent",
      "avatar": null,
      "is_verified": false,
      "created_at": "2025-11-08T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 2. Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "admin",
      "avatar": "/uploads/avatars/user-1-12345.jpg",
      "is_verified": true,
      "last_login": "2025-11-08T11:30:00.000Z",
      "organization": {
        "name": "Acme Inc",
        "logo": "/uploads/logos/acme-12345.png"
      },
      "settings": {
        "notifications": true,
        "theme": "light",
        "language": "en"
      },
      "created_at": "2025-11-01T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 3. Verify Email
**GET** `/auth/verify-email/:token`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

#### 4. Forgot Password
**POST** `/auth/forgot-password`

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

#### 5. Reset Password
**POST** `/auth/reset-password`

**Request Body:**
```json
{
  "token": "reset-token-12345",
  "password": "NewSecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

### Users & Profile Endpoints

#### 1. Get Profile
**GET** `/users/profile`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "admin",
    "avatar": "/uploads/avatars/user-1-12345.jpg",
    "is_verified": true,
    "last_login": "2025-11-08T11:30:00.000Z",
    "created_at": "2025-11-01T10:30:00.000Z",
    "updated_at": "2025-11-08T11:30:00.000Z"
  }
}
```

#### 2. Update Profile
**PUT** `/users/profile`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "first_name": "Jonathan",
  "last_name": "Doe",
  "email": "jonathan@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "first_name": "Jonathan",
    "last_name": "Doe",
    "email": "jonathan@example.com",
    "updated_at": "2025-11-08T12:00:00.000Z"
  }
}
```

### Contacts Endpoints

#### 1. Create Contact
**POST** `/contacts`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "first_name": "Sarah",
  "last_name": "Johnson",
  "email": "sarah.johnson@example.com",
  "phone": "+1234567890",
  "company": "Tech Solutions Ltd",
  "job_title": "Marketing Director",
  "status": "active",
  "source": "website",
  "notes": "Met at tech conference, interested in our enterprise plan",
  "tags": ["tech", "marketing", "lead"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Contact created successfully",
  "data": {
    "contact": {
      "id": 101,
      "first_name": "Sarah",
      "last_name": "Johnson",
      "email": "sarah.johnson@example.com",
      "phone": "+1234567890",
      "company": "Tech Solutions Ltd",
      "job_title": "Marketing Director",
      "status": "active",
      "source": "website",
      "notes": "Met at tech conference, interested in our enterprise plan",
      "tags": ["tech", "marketing", "lead"],
      "user_id": 1,
      "created_at": "2025-11-08T15:30:00.000Z",
      "updated_at": "2025-11-08T15:30:00.000Z"
    }
  }
}
```

### Deals & Sales Pipeline Endpoints

#### 1. Create Deal
**POST** `/deals`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "name": "Enterprise Plan - Tech Solutions",
  "contact_id": 101,
  "stage": "lead",
  "amount": 15000.00,
  "probability": 20,
  "expected_close_date": "2025-12-15",
  "notes": "Interested in annual subscription with premium support",
  "user_id": 1
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Deal created successfully",
  "data": {
    "deal": {
      "id": 201,
      "name": "Enterprise Plan - Tech Solutions",
      "contact_id": 101,
      "user_id": 1,
      "stage": "lead",
      "amount": 15000.00,
      "probability": 20,
      "expected_close_date": "2025-12-15",
      "actual_close_date": null,
      "status": "open",
      "notes": "Interested in annual subscription with premium support",
      "created_at": "2025-11-08T16:30:00.000Z",
      "updated_at": "2025-11-08T16:30:00.000Z",
      "contact": {
        "id": 101,
        "first_name": "Sarah",
        "last_name": "Johnson",
        "company": "Tech Solutions Ltd"
      },
      "user": {
        "id": 1,
        "first_name": "John",
        "last_name": "Doe"
      }
    }
  }
}
```

### Support Tickets Endpoints

#### 1. Create Ticket
**POST** `/tickets`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "subject": "Cannot access premium features",
  "description": "User upgraded to premium but features are still locked",
  "contact_id": 101,
  "priority": "high",
  "due_date": "2025-11-10"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Ticket created successfully",
  "data": {
    "ticket": {
      "id": 301,
      "ticket_number": "TKT-2025-0001",
      "subject": "Cannot access premium features",
      "description": "User upgraded to premium but features are still locked",
      "contact_id": 101,
      "user_id": 1,
      "assigned_to": null,
      "priority": "high",
      "status": "new",
      "due_date": "2025-11-10",
      "resolved_at": null,
      "created_at": "2025-11-08T18:00:00.000Z",
      "updated_at": "2025-11-08T18:00:00.000Z",
      "sla": {
        "response_due": "2025-11-08T20:00:00.000Z",
        "resolution_due": "2025-11-10T18:00:00.000Z"
      }
    }
  }
}
```

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "msg": "Field validation error",
      "param": "field_name",
      "location": "body"
    }
  ],
  "timestamp": "2025-11-08T22:30:00.000Z",
  "path": "/api/auth/login",
  "method": "POST"
}
```

### Common Error Codes
- **400**: Bad Request - Validation errors
- **401**: Unauthorized - Invalid or missing token
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource not found
- **409**: Conflict - Resource already exists
- **422**: Unprocessable Entity - Business logic errors
- **429**: Too Many Requests - Rate limit exceeded
- **500**: Internal Server Error - Server-side error

## Rate Limiting

### Limits
- **Authentication endpoints**: 5 requests per 15 minutes
- **General API endpoints**: 100 requests per 15 minutes
- **Email campaigns**: 50 requests per hour
- **File uploads**: 10 requests per hour

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705316400
Retry-After: 900
```

## Real-time Updates

### Polling Mechanism
Since WebSocket is not used, real-time updates are achieved through:

1. **Immediate Responses**: All create/update/delete operations return updated data
2. **Periodic Polling**: Frontend can poll for updates at intervals
3. **Email Notifications**: Critical updates sent via email

### Frontend Implementation Example:
```javascript
class DeraCRMClient {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
    this.dashboardData = null;
  }

  async getDashboard() {
    const response = await fetch(`${this.baseURL}/dashboard`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      this.dashboardData = result.data;
      return result;
    }
    
    return result;
  }

  // Poll for dashboard updates
  startDashboardPolling(interval = 30000) {
    this.pollingInterval = setInterval(async () => {
      await this.getDashboard();
      this.onDashboardUpdate(this.dashboardData);
    }, interval);
  }

  onDashboardUpdate(data) {
    // Override this method to handle updates
    console.log('Dashboard updated:', data);
  }
}
```

---

**Version:** 1.0.0  
**Last Updated:** November 8, 2025  
**Status:** Production Ready  
**Author:** Nwankwo Chidera David
```

## `docs/DEPLOYMENT.md`

```markdown
# DERA CRM Backend - Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Application Deployment](#application-deployment)
5. [Production Configuration](#production-configuration)
6. [Security Considerations](#security-considerations)
7. [Monitoring & Logging](#monitoring--logging)
8. [Backup & Recovery](#backup--recovery)
9. [Scaling](#scaling)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04 LTS or higher (Recommended)
- **CPU**: 2+ cores
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 20GB minimum (SSD recommended)
- **Node.js**: v16.x or higher
- **PostgreSQL**: v12.x or higher
- **Redis**: v6.x or higher
- **Nginx**: v1.18 or higher (for reverse proxy)

### Software Installation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 16.x
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2

# Verify installations
node --version
npm --version
psql --version
redis-server --version
nginx -v
pm2 --version
```

## Environment Setup

### 1. Clone Repository
```bash
# Create application directory
sudo mkdir -p /var/www/dera-crm
sudo chown -R $USER:$USER /var/www/dera-crm

# Clone repository
git clone https://github.com/yourusername/dera-crm-backend.git /var/www/dera-crm
cd /var/www/dera-crm
```

### 2. Install Dependencies
```bash
npm install --production
```

### 3. Configure Environment Variables
```bash
# Copy example env file
cp .env.example .env

# Edit .env file with production values
nano .env
```

**Production .env Configuration:**
```env
# Server Configuration
NODE_ENV=production
PORT=5000
SERVER_URL=https://api.deracrm.com
FRONTEND_URL=https://app.deracrm.com

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=deracrm_user
DB_PASSWORD=StrongDBPassword123!
DB_NAME=deracrm_prod

# JWT Configuration
JWT_SECRET=your-strong-64-character-jwt-secret-key-here
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=another-strong-64-character-refresh-secret-key
JWT_REFRESH_EXPIRE=30d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@deracrm.com
SMTP_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@deracrm.com

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Security
CORS_ORIGIN=https://app.deracrm.com
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=5
```

## Database Setup

### 1. Create Database and User
```bash
# Access PostgreSQL
sudo -u postgres psql

# Create database user
CREATE USER deracrm_user WITH PASSWORD 'StrongDBPassword123!';

# Create database
CREATE DATABASE deracrm_prod OWNER deracrm_user;

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE deracrm_prod TO deracrm_user;

# Exit PostgreSQL
\q
```

### 2. Run Migrations and Seeders
```bash
# Run migrations
cd /var/www/dera-crm
NODE_ENV=production npm run db:migrate

# Run seeders (optional - for initial data)
NODE_ENV=production npm run db:seed

# Create admin user
NODE_ENV=production npm run create:admin
```

## Application Deployment

### 1. Build Application
```bash
# Build TypeScript to JavaScript
npm run build
```

### 2. Start with PM2
```bash
# Start application with PM2
pm2 start dist/index.js --name dera-crm-api

# Save PM2 configuration
pm2 save
pm2 startup

# Monitor application
pm2 monit
pm2 logs dera-crm-api
```

### 3. Configure Nginx as Reverse Proxy

Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/dera-crm-api
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name api.deracrm.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.deracrm.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/api.deracrm.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.deracrm.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logs
    access_log /var/log/nginx/dera-crm-api-access.log;
    error_log /var/log/nginx/dera-crm-api-error.log;

    # Upload size limit
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Serve uploaded files
    location /uploads {
        alias /var/www/dera-crm/uploads;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/dera-crm-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. SSL Certificate with Let's Encrypt
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d api.deracrm.com

# Auto-renewal
sudo certbot renew --dry-run
```

## Production Configuration

### 1. Redis Optimization
```bash
sudo nano /etc/redis/redis.conf
```

**Redis Configuration:**
```conf
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

Restart Redis:
```bash
sudo systemctl restart redis-server
```

### 2. PostgreSQL Optimization
```bash
sudo nano /etc/postgresql/12/main/postgresql.conf
```

**PostgreSQL Configuration:**
```conf
shared_buffers = 1GB
effective_cache_size = 3GB
maintenance_work_mem = 256MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 6553kB
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

### 3. PM2 Configuration
Create PM2 ecosystem file:
```bash
nano ecosystem.config.js
```

**PM2 Configuration:**
```javascript
module.exports = {
  apps: [{
    name: 'dera-crm-api',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/var/log/dera-crm/err.log',
    out_file: '/var/log/dera-crm/out.log',
    log_file: '/var/log/dera-crm/combined.log',
    time: true
  }]
};
```

Start with cluster mode:
```bash
pm2 start ecosystem.config.js
```

## Security Considerations

### 1. Firewall Configuration
```bash
# Configure UFW
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

### 2. Fail2ban Installation
```bash
sudo apt install -y fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Regular Security Updates
```bash
# Create update script
sudo nano /usr/local/bin/security-updates.sh
```

**Update Script:**
```bash
#!/bin/bash
apt update
apt upgrade -y
apt autoremove -y
systemctl restart dera-crm-api
```

Make executable and add to cron:
```bash
sudo chmod +x /usr/local/bin/security-updates.sh
sudo crontab -e
# Add: 0 2 * * 0 /usr/local/bin/security-updates.sh
```

## Monitoring & Logging

### 1. Application Logs
```bash
# View PM2 logs
pm2 logs dera-crm-api

# View application logs
tail -f /var/log/dera-crm/combined.log
```

### 2. System Monitoring with Netdata
```bash
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
```

### 3. Database Monitoring
```sql
-- Check active connections
SELECT * FROM pg_stat_activity;

-- Monitor database size
SELECT pg_database_size('deracrm_prod')/1024/1024 AS size_mb;

-- Check slow queries
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

## Backup & Recovery

### 1. Automated Backups
Create backup script:
```bash
sudo nano /usr/local/bin/backup-deracrm.sh
```

**Backup Script:**
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/deracrm"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="deracrm_prod"
DB_USER="deracrm_user"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/db_$TIMESTAMP.sql.gz

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$TIMESTAMP.tar.gz /var/www/dera-crm/uploads

# Backup .env file
cp /var/www/dera-crm/.env $BACKUP_DIR/env_$TIMESTAMP

# Keep only last 30 days of backups
find $BACKUP_DIR -type f -mtime +30 -delete

# Upload to remote storage (optional)
# rsync -avz $BACKUP_DIR/ user@backup-server:/backups/
```

Make executable and add to cron:
```bash
sudo chmod +x /usr/local/bin/backup-deracrm.sh
sudo crontab -e
# Add: 0 1 * * * /usr/local/bin/backup-deracrm.sh
```

### 2. Recovery Procedure
```bash
# Restore database
gunzip -c /var/backups/deracrm/db_20251108_020000.sql.gz | psql -U deracrm_user deracrm_prod

# Restore uploads
tar -xzf /var/backups/deracrm/uploads_20251108_020000.tar.gz -C /

# Restore environment
cp /var/backups/deracrm/env_20251108_020000 /var/www/dera-crm/.env
```

## Scaling

### Horizontal Scaling with Load Balancer

1. **Setup Multiple Application Servers**
2. **Configure HAProxy or Nginx as Load Balancer**
3. **Use External PostgreSQL (e.g., AWS RDS)**
4. **Use External Redis (e.g., AWS ElastiCache)**

**HAProxy Configuration Example:**
```haproxy
global
    log /dev/log local0
    maxconn 4096

defaults
    log global
    mode http
    option httplog
    option dontlognull
    retries 3
    timeout connect 5000
    timeout client 50000
    timeout server 50000

frontend http-in
    bind *:80
    bind *:443 ssl crt /etc/ssl/certs/dera-crm.pem
    default_backend deracrm_servers

backend deracrm_servers
    balance roundrobin
    server server1 10.0.0.1:5000 check
    server server2 10.0.0.2:5000 check
    server server3 10.0.0.3:5000 check
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Application Won't Start
```bash
# Check logs
pm2 logs dera-crm-api --lines 100

# Verify environment variables
cat /var/www/dera-crm/.env

# Check database connection
psql -U deracrm_user -d deracrm_prod -c "SELECT 1"

# Check Redis connection
redis-cli ping
```

#### 2. Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-12-main.log

# Test connection
psql -h localhost -U deracrm_user -d deracrm_prod
```

#### 3. High Memory Usage
```bash
# Check memory usage
free -h
top

# Check Node.js memory usage
pm2 monit

# Adjust PM2 memory limit
pm2 restart dera-crm-api --max-memory-restart 2G
```

#### 4. SSL Certificate Issues
```bash
# Check certificate expiration
sudo certbot certificates

# Renew certificate
sudo certbot renew --force-renewal

# Test renewal
sudo certbot renew --dry-run
```

### Performance Testing
```bash
# Install Apache Bench
sudo apt install -y apache2-utils

# Run load test
ab -n 1000 -c 100 https://api.deracrm.com/health
```

### Health Check Endpoint
```bash
# Check API health
curl https://api.deracrm.com/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-08T22:30:00.000Z",
  "service": "DERA CRM API",
  "version": "1.0.0",
  "database": "connected",
  "redis": "connected",
  "uptime": "3 days, 5 hours"
}
```
