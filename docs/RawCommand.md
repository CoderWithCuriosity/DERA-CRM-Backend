# PostgreSQL Database Setup Guide

## Prerequisites
- PostgreSQL installed on your system
- Node.js and npm installed
- Project files available locally

## Initial Database Setup

### 1. Access PostgreSQL
```bash
# Open PostgreSQL command line
psql -U postgres
# Enter your password if prompted
```

### 2. Create Database and User
Run these commands in the PostgreSQL shell:

```sql
-- Create a new database
CREATE DATABASE deracrm_prod;

-- Create a dedicated user (optional)
CREATE USER deracrm_user WITH PASSWORD 'strong_password';

-- Grant database privileges
GRANT ALL PRIVILEGES ON DATABASE deracrm_prod TO deracrm_user;
```

### 3. Configure Database Permissions
Connect to your database and set up schema permissions:

```sql
-- Connect to your database
\c deracrm_prod;

-- Grant schema permissions
GRANT USAGE ON SCHEMA public TO deracrm_user;
GRANT CREATE ON SCHEMA public TO deracrm_user;
```

Exit PostgreSQL shell:
```sql
\q
```

## Project Setup & Database Migration

### 4. Initialize Database Structure
Navigate to your project folder and run:

```bash
# Generate migration files
npm run db:init

# Apply migrations to create tables
npm run db:migrate
```

### 5. Create Admin User
Run the admin creation script:

```bash
# Create initial admin account
npx ts-node scripts/createAdmin.ts
```

## ✅ Verification Steps
- [ ] Database `deracrm_prod` created
- [ ] User `deracrm_user` created (if needed)
- [ ] Permissions properly configured
- [ ] Migration files generated
- [ ] Tables created successfully
- [ ] Admin account created

## ⚠️ Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `Permission denied` | Ensure you've run all GRANT commands |
| `Database already exists` | Use `DROP DATABASE IF EXISTS deracrm_prod;` first |
| `User already exists` | Use `DROP USER IF EXISTS deracrm_user;` first |
| Migration fails | Check your database connection string in `.env` |

## Environment Variables
Make sure your `.env` file contains:
```env
DATABASE_URL=postgresql://deracrm_user:strong_password@localhost:5432/deracrm_prod
```

