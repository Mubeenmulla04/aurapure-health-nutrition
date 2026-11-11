#!/bin/bash
# MongoDB automated backup script for AuraPure Nutrition
BACKUP_DIR="/var/backups/mongodb"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATABASE_NAME="aurapure_ecommerce"

mkdir -p "$BACKUP_DIR"

echo "Initiating backup for $DATABASE_NAME..."
docker exec aurapure-mongodb mongodump --db "$DATABASE_NAME" --out /data/db/backup_tmp

docker cp aurapure-mongodb:/data/db/backup_tmp/$DATABASE_NAME "$BACKUP_DIR/$DATABASE_NAME-$TIMESTAMP"
docker exec aurapure-mongodb rm -rf /data/db/backup_tmp

tar -czf "$BACKUP_DIR/aurapure_backup_$TIMESTAMP.tar.gz" -C "$BACKUP_DIR" "$DATABASE_NAME-$TIMESTAMP"
rm -rf "$BACKUP_DIR/$DATABASE_NAME-$TIMESTAMP"

# Retain only last 14 days of backups
find "$BACKUP_DIR" -type f -name "*.tar.gz" -mtime +14 -delete

echo "Backup complete: $BACKUP_DIR/aurapure_backup_$TIMESTAMP.tar.gz"
