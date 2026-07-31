#!/bin/sh

echo "Starting entrypoint script..."

PRISMA="/opt/app/node_modules/.bin/prisma"

echo "Migrating database..."
if ! "$PRISMA" migrate deploy; then
    echo "Database migration failed! Exiting container..."
    exit 1
fi

echo "Migrations deployed successfully!"

echo "Seeding database..."
if ! "$PRISMA" db seed; then
    echo "Database seeding failed! Exiting container..."
    exit 1
fi

echo "Entrypoint script completed."
exec "$@"