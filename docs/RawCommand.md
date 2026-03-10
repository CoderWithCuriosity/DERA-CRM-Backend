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



In the folder run this command
npm run db:init

this will generate all the migration file for the database, then run 

npm run db:migrate

this will create all the tables from the migrated file.

