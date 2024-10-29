if ! service postgresql status | grep -q "online"; then
  echo "PostgreSQL is not running. Starting it now..."
  sudo service postgresql start
else
  echo "PostgreSQL is already running."
fi