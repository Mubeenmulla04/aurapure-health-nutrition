#!/bin/bash
# MongoDB restore script for AuraPure Nutrition
if [ -z "$1" ]; then
  echo "Usage: ./restore_mongodb.sh /path/to/aurapure_backup_YYYYMMDD_HHMMSS.tar.gz"
  exit 1
fi

ARCHIVE_PATH="$1"
RESTORE_DIR="/tmp/restore_db"
DATABASE_NAME="aurapure_ecommerce"

mkdir -p "$RESTORE_DIR"
tar -xzf "$ARCHIVE_PATH" -C "$RESTORE_DIR"

DIR_NAME=$(ls "$RESTORE_DIR")
docker cp "$RESTORE_DIR/$DIR_NAME" aurapure-mongodb:/data/db/restore_tmp

echo "Restoring database $DATABASE_NAME..."
docker exec aurapure-mongodb mongorestore --db "$DATABASE_NAME" --drop /data/db/restore_tmp

docker exec aurapure-mongodb rm -rf /data/db/restore_tmp
rm -rf "$RESTORE_DIR"

echo "Database restoration completed successfully."
