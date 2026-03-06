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

