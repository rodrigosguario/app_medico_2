#!/bin/bash
set -e

# MedicoAgenda Backup Script
# This script creates backups of application data and configurations

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

echo "🔄 Starting backup process..."

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup Redis data (if running)
if docker-compose ps redis | grep -q "Up"; then
    echo "📊 Backing up Redis data..."
    docker-compose exec -T redis redis-cli BGSAVE
    sleep 5
    docker cp $(docker-compose ps -q redis):/data/dump.rdb $BACKUP_DIR/redis_backup_$DATE.rdb
    echo "✓ Redis backup completed"
fi

# Backup application configuration
echo "📁 Backing up configuration files..."
tar -czf $BACKUP_DIR/config_backup_$DATE.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='logs' \
    .env* \
    docker-compose*.yml \
    nginx.conf \
    package*.json \
    src/integrations/supabase/ \
    2>/dev/null || echo "Some files might not exist, continuing..."

echo "✓ Configuration backup completed"

# Backup logs
if [ -d "logs" ]; then
    echo "📋 Backing up logs..."
    tar -czf $BACKUP_DIR/logs_backup_$DATE.tar.gz logs/
    echo "✓ Logs backup completed"
fi

# Clean old backups
echo "🧹 Cleaning old backups (older than $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "*.rdb" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
echo "✓ Cleanup completed"

# List current backups
echo "📝 Current backups:"
ls -la $BACKUP_DIR/ | grep "_backup_"

echo "✅ Backup process completed successfully!"
echo "💾 Backup files created with timestamp: $DATE"