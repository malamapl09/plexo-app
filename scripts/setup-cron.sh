#!/bin/bash
set -euo pipefail

# Add backup cron job - runs daily at 3 AM UTC
CRON_JOB="0 3 * * * /opt/plexo/scripts/backup.sh >> /var/log/plexo-backup.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "plexo.*backup"; then
  echo "Backup cron job already exists"
else
  (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
  echo "Backup cron job added: daily at 3 AM UTC"
fi
