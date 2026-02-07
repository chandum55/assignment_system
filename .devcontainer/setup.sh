#!/bin/bash

# Wait for MySQL to be ready
echo "Waiting for MySQL to start..."
until mysqladmin ping -h db --silent; do
    sleep 2
done

# Initialize database
echo "Initializing GradeFlow database..."
mysql -h db -u root -e "CREATE DATABASE IF NOT EXISTS gradeflow;"
mysql -h db -u root gradeflow < database.sql

echo "Setup complete! App is running on port 80."
