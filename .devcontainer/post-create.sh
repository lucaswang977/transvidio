#!/bin/zsh
source ~/.zshrc
omz theme set simple
omz plugin enable vi-mode

sudo service postgresql start
psql -U postgres -h 127.0.0.1 -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'puser') THEN CREATE ROLE puser WITH LOGIN PASSWORD 'localdbpassword'; END IF; END \$\$;"
if ! psql -U postgres -h 127.0.0.1 -tc "SELECT 1 FROM pg_database WHERE datname = 'testdb1'" | grep -q 1; then
    psql -U postgres -h 127.0.0.1 -c "CREATE DATABASE testdb1 ENCODING 'UTF8' OWNER puser TEMPLATE template0;"
else
    echo "Database 'testdb1' already exists."
fi