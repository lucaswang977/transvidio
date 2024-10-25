#!/bin/zsh
source ~/.zshrc
omz theme set simple
omz plugin enable vi-mode

sudo service postgresql start
psql -U postgres -h 127.0.0.1 -c "CREATE ROLE puser LOGIN password 'localdbpassword';" -c "CREATE DATABASE testdb1 ENCODING 'UTF8' OWNER puser TEMPLATE template0;"
