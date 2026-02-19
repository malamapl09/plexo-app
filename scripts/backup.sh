#!/bin/bash
set -euo pipefail

# Configuration
DB_HOST="${RDS_HOST:?RDS_HOST not set}"
DB_USER="${POSTGRES_USER:-plexo}"
DB_NAME="${POSTGRES_DB:-plexo}"
S3_BUCKET="${BACKUP_S3_BUCKET:?BACKUP_S3_BUCKET not set}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/tmp/plexo_backup_${TIMESTAMP}.sql.gz"

echo "[$(date)] Starting backup..."

# Dump database (uses .pgpass for auth — avoids leaking password in process table)
PGPASS_FILE=$(mktemp)
chmod 600 "$PGPASS_FILE"
echo "${DB_HOST}:5432:${DB_NAME}:${DB_USER}:${POSTGRES_PASSWORD:?POSTGRES_PASSWORD not set}" > "$PGPASS_FILE"
PGPASSFILE="$PGPASS_FILE" pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" --no-owner --no-privileges | gzip > "$BACKUP_FILE"
rm -f "$PGPASS_FILE"

echo "[$(date)] Dump complete: $(du -h "$BACKUP_FILE" | cut -f1)"

# Upload to S3
aws s3 cp "$BACKUP_FILE" "s3://${S3_BUCKET}/backups/plexo_backup_${TIMESTAMP}.sql.gz"

echo "[$(date)] Uploaded to S3"

# Clean up local file
rm -f "$BACKUP_FILE"

# Delete backups older than 30 days
aws s3 ls "s3://${S3_BUCKET}/backups/" | while read -r line; do
  file_date=$(echo "$line" | awk '{print $1}')
  file_name=$(echo "$line" | awk '{print $4}')
  if [ -n "$file_name" ]; then
    file_epoch=$(date -d "$file_date" +%s 2>/dev/null || date -jf "%Y-%m-%d" "$file_date" +%s 2>/dev/null || echo 0)
    thirty_days_ago=$(date -d "30 days ago" +%s 2>/dev/null || date -v-30d +%s 2>/dev/null || echo 0)
    if [ "$file_epoch" -lt "$thirty_days_ago" ] && [ "$file_epoch" -gt 0 ]; then
      aws s3 rm "s3://${S3_BUCKET}/backups/$file_name"
      echo "[$(date)] Deleted old backup: $file_name"
    fi
  fi
done

echo "[$(date)] Backup complete!"
