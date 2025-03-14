#!/bin/sh

echo "Starting entrypoint script..."

echo "Migrating database..."
npm run migrate:deploy

echo "Seeding database..."
npm run migrate:seed

echo "Starting pm2..."
pm2-runtime start ecosystem.config.js --env production

echo "Entrypoint script completed."
