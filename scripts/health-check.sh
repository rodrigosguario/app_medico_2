#!/bin/bash

# Health Check Script for MedicoAgenda
# This script performs comprehensive health checks

PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd $PROJECT_ROOT

ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.yml"

if [ "$ENVIRONMENT" = "production" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
fi

echo "🏥 MedicoAgenda Health Check"
echo "============================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running"
    exit 1
fi
echo "✅ Docker is running"

# Check container status
echo ""
echo "📊 Container Status:"
docker-compose -f $COMPOSE_FILE ps

# Check frontend health
echo ""
echo "🌐 Frontend Health Check:"
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend health check failed"
fi

# Check Redis (if running)
echo ""
echo "💾 Redis Health Check:"
if docker-compose -f $COMPOSE_FILE ps redis | grep -q "Up"; then
    if docker-compose -f $COMPOSE_FILE exec -T redis redis-cli ping | grep -q "PONG"; then
        echo "✅ Redis is responding"
    else
        echo "❌ Redis is not responding"
    fi
else
    echo "⚠️  Redis is not running"
fi

# Check disk space
echo ""
echo "💽 Disk Space:"
df -h / | awk 'NR==2 {print "Used: " $5 " of " $2}'
USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $USAGE -gt 80 ]; then
    echo "⚠️  Disk usage is high ($USAGE%)"
else
    echo "✅ Disk usage is normal ($USAGE%)"
fi

# Check memory usage
echo ""
echo "🧠 Memory Usage:"
free -h | awk 'NR==2{printf "Used: %s of %s (%.2f%%)\n", $3, $2, $3*100/$2}'

# Check logs for errors (last 100 lines)
echo ""
echo "📋 Recent Logs Check:"
ERROR_COUNT=$(docker-compose -f $COMPOSE_FILE logs --tail=100 2>/dev/null | grep -i error | wc -l)
if [ $ERROR_COUNT -gt 0 ]; then
    echo "⚠️  Found $ERROR_COUNT error(s) in recent logs"
else
    echo "✅ No errors in recent logs"
fi

# SSL certificate check (for production)
if [ "$ENVIRONMENT" = "production" ]; then
    echo ""
    echo "🔒 SSL Certificate Check:"
    if [ -f "nginx/ssl/cert.pem" ]; then
        EXPIRY=$(openssl x509 -in nginx/ssl/cert.pem -noout -enddate | cut -d= -f2)
        EXPIRY_TIMESTAMP=$(date -d "$EXPIRY" +%s)
        CURRENT_TIMESTAMP=$(date +%s)
        DAYS_UNTIL_EXPIRY=$(( ($EXPIRY_TIMESTAMP - $CURRENT_TIMESTAMP) / 86400 ))
        
        if [ $DAYS_UNTIL_EXPIRY -lt 30 ]; then
            echo "⚠️  SSL certificate expires in $DAYS_UNTIL_EXPIRY days"
        else
            echo "✅ SSL certificate valid for $DAYS_UNTIL_EXPIRY days"
        fi
    else
        echo "❌ SSL certificate not found"
    fi
fi

echo ""
echo "🏥 Health check completed!"