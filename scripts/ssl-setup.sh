#!/bin/bash
set -e

# SSL Certificate Setup Script for MedicoAgenda
# This script sets up SSL certificates using Let's Encrypt

DOMAIN=${1:-medicoagenda.com}
EMAIL=${2:-admin@$DOMAIN}

echo "🔒 Setting up SSL certificates for $DOMAIN"

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing Certbot..."
    
    # Install snapd if not present
    if ! command -v snap &> /dev/null; then
        sudo apt update
        sudo apt install -y snapd
    fi
    
    # Install certbot via snap
    sudo snap install core
    sudo snap refresh core
    sudo snap install --classic certbot
    sudo ln -sf /snap/bin/certbot /usr/bin/certbot
    
    echo "✅ Certbot installed successfully"
fi

# Create SSL directory
mkdir -p nginx/ssl

# Check if we're running in production
if docker-compose -f docker-compose.prod.yml ps nginx | grep -q "Up"; then
    echo "⏸️  Stopping Nginx for certificate generation..."
    docker-compose -f docker-compose.prod.yml stop nginx
fi

# Generate certificate
echo "🔄 Generating SSL certificate..."
sudo certbot certonly --standalone \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

# Copy certificates to nginx directory
echo "📋 Copying certificates..."
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem nginx/ssl/key.pem

# Set proper permissions
sudo chown $USER:$USER nginx/ssl/*.pem
chmod 600 nginx/ssl/*.pem

# Restart Nginx if it was running
if docker-compose -f docker-compose.prod.yml ps | grep -q nginx; then
    echo "🔄 Restarting Nginx with SSL..."
    docker-compose -f docker-compose.prod.yml up -d nginx
fi

# Setup auto-renewal
echo "⏰ Setting up automatic renewal..."
(crontab -l 2>/dev/null; echo "0 3 1 * * $(pwd)/scripts/ssl-renew.sh") | crontab -

echo "✅ SSL setup completed successfully!"
echo "🔒 Your site is now secured with HTTPS"
echo "📅 Certificates will auto-renew on the 1st of each month at 3 AM"