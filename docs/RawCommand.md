After installing Postgres

cmd

psql -U postgres

put your password if you set a password during installation

then run the command 

CREATE DATABASE deracrm_prod;

if you want to use a different user then do 

CREATE USER deracrm_user WITH PASSWORD 'strong_password';

then run 

GRANT ALL PRIVILEGES ON DATABASE deracrm_prod TO deracrm_user;


before you can run the npm run db:resync you need to run the following command below

Ensure to run all these commands 

-- Connect to the specific database
\c deracrm_prod;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO deracrm_user;

-- Grant create on schema (needed for creating tables)
GRANT CREATE ON SCHEMA public TO deracrm_user;




That comman above is all you need but if any issues you can try the command below.

-- Grant all privileges on all tables (for existing tables if any)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO deracrm_user;

-- Grant all privileges on all sequences
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO deracrm_user;

-- Grant all privileges on all functions
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO deracrm_user;

-- Make these permissions default for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO deracrm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO deracrm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO deracrm_user;


    
