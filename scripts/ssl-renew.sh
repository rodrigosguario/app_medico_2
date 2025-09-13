#!/bin/bash
set -e

# SSL Certificate Renewal Script
PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd $PROJECT_ROOT

DOMAIN=${1:-medicoagenda.com}

echo "🔄 Renewing SSL certificates for $DOMAIN..."

# Stop Nginx
if docker-compose -f docker-compose.prod.yml ps nginx | grep -q "Up"; then
    echo "⏸️  Stopping Nginx..."
    docker-compose -f docker-compose.prod.yml stop nginx
fi

# Renew certificate
echo "🔒 Renewing certificate..."
sudo certbot renew --quiet

# Copy renewed certificates
echo "📋 Updating certificates..."
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem nginx/ssl/key.pem
sudo chown $USER:$USER nginx/ssl/*.pem
chmod 600 nginx/ssl/*.pem

# Restart Nginx
echo "🔄 Starting Nginx with renewed certificates..."
docker-compose -f docker-compose.prod.yml up -d nginx

# Log renewal
echo "$(date): SSL certificate renewed for $DOMAIN" >> logs/ssl-renewal.log

echo "✅ SSL certificate renewal completed!"