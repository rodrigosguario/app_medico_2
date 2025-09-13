#!/bin/bash
set -e

# MedicoAgenda Deployment Script
# Usage: ./scripts/deploy.sh [environment]

ENVIRONMENT=${1:-production}
PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)

echo "🚀 Starting deployment for environment: $ENVIRONMENT"

# Load environment variables
if [ -f ".env.${ENVIRONMENT}" ]; then
    source ".env.${ENVIRONMENT}"
    echo "✓ Environment variables loaded from .env.${ENVIRONMENT}"
else
    echo "❌ Environment file .env.${ENVIRONMENT} not found"
    exit 1
fi

# Create necessary directories
mkdir -p logs uploads backups nginx/ssl monitoring/grafana/{dashboards,datasources}

# Build and deploy based on environment
case $ENVIRONMENT in
    "development")
        echo "🔧 Building for development..."
        docker-compose down
        docker-compose up --build -d
        ;;
    "production")
        echo "🏭 Building for production..."
        
        # Stop existing services
        docker-compose -f docker-compose.prod.yml down
        
        # Build new images
        docker-compose -f docker-compose.prod.yml build --no-cache
        
        # Start services
        docker-compose -f docker-compose.prod.yml up -d
        
        # Wait for services to be ready
        echo "⏳ Waiting for services to start..."
        sleep 30
        
        # Health check
        if curl -f http://localhost/health > /dev/null 2>&1; then
            echo "✅ Deployment successful! Application is healthy."
        else
            echo "❌ Deployment failed! Health check failed."
            exit 1
        fi
        ;;
    *)
        echo "❌ Invalid environment: $ENVIRONMENT"
        echo "Usage: $0 [development|production]"
        exit 1
        ;;
esac

echo "🎉 Deployment completed successfully!"