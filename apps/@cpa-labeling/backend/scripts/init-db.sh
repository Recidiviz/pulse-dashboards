#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create labeling database if it doesn't exist
    SELECT 'CREATE DATABASE labeling'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'labeling')\gexec

    -- Grant permissions to postgres user
    GRANT ALL PRIVILEGES ON DATABASE labeling TO postgres;
EOSQL

echo "Databases 'reentry' and 'labeling' are ready"
