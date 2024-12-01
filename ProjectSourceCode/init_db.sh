#!/bin/bash

# DO NOT PUSH THIS FILE TO GITHUB
# This file contains sensitive information and should be kept private

# TODO: Set your PostgreSQL URI - Use the External Database URL from the Render dashboard
PG_URI="postgresql://users_db_uwh0_user:9qko3Jso7RDg5xS9hBeqtZLEioM99sFD@dpg-ct69arilqhvc73agkfag-a.oregon-postgres.render.com/users_db_ng0m"

# Execute each .sql file in the directory
for file in src/init_data/*.sql; do
    echo "Executing $file..."
    psql $PG_URI -f "$file"
done