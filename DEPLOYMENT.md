# 🚀 MedicoAgenda Deployment Guide

Este guia cobre o deployment do MedicoAgenda com integração Supabase para produção.

## 📋 Prerequisites

- Node.js 18+
- Docker & Docker Compose (for containerized deployment)
- Git
- A Supabase project configured
- Domain DNS configured (planton-sync.lovable.app)

## 🔧 Quick Setup

1. **Clone and setup the project:**
```bash
git clone <repository-url>
cd medicoagenda
chmod +x scripts/*.sh
./scripts/setup.sh
```

2. **Configure environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
# VITE_SUPABASE_PROJECT_ID=your-project-id
# OPENAI_API_KEY=your-openai-key
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# DOMAIN=planton-sync.lovable.app
```

3. **Start development server:**
```bash
npm run dev
# or with Docker:
npm run docker:dev
```

## 🐳 Docker Deployment

### Development
```bash
docker-compose up --build
```

### Production
```bash
# Copy production environment
cp .env.example .env.production

# Edit with production values including:
# - Real Supabase credentials
# - OpenAI API key for AI features
# - Redis password for caching
# - Grafana password for monitoring
nano .env.production

# Deploy
npm run docker:prod
```

## 🌐 Production Deployment

### 1. Server Setup
```bash
# On your production server
./scripts/deploy.sh production
```

### 2. SSL Configuration
```bash
# Setup SSL certificates for planton-sync.lovable.app
./scripts/ssl-setup.sh planton-sync.lovable.app admin@planton-sync.lovable.app
```

### 3. Environment Variables Setup
Critical environment variables for production:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabase anon/public key
- `VITE_SUPABASE_PROJECT_ID`: Your project ID
- `OPENAI_API_KEY`: For AI assistant features
- `SUPABASE_SERVICE_ROLE_KEY`: For edge functions
- `REDIS_PASSWORD`: For caching layer
- `GRAFANA_PASSWORD`: For monitoring dashboard

### 4. Build Process
The Dockerfile now correctly installs all dependencies including devDependencies needed for Vite build process.

## 📊 Health Monitoring

```bash
# Check system health
./scripts/health-check.sh

# View logs
npm run docker:logs

# Run tests
npm test
```

## 💾 Backup & Maintenance

```bash
# Create backup
./scripts/backup.sh

# Restore from backup (manual process)
# See backup files in ./backups/
```

## 🔒 Security Features

- SSL/TLS encryption via Let's Encrypt
- Rate limiting configured in Nginx
- Security headers (HSTS, CSP, etc.)
- Container security best practices
- Automated SSL renewal

## 📈 Monitoring & Alerting

Access Grafana at `https://planton-sync.lovable.app:3000`:
- Username: admin
- Password: Set in .env.production (GRAFANA_PASSWORD)

Prometheus metrics available at `:9090`

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Tests cover:
- Authentication flows
- Calendar functionality
- Financial module
- Import/Export features

## 🆘 Troubleshooting

1. **Container won't start:**
   ```bash
   docker-compose logs [service-name]
   ```

2. **SSL issues:**
   ```bash
   ./scripts/ssl-renew.sh
   ```

3. **Build failures:**
   - Ensure all environment variables are set
   - Check that Vite dependencies are installed
   - Verify Supabase connection

4. **API Integration Issues:**
   - Verify OPENAI_API_KEY is set for AI features
   - Check SUPABASE_SERVICE_ROLE_KEY for sync functions
   - Validate external API tokens (Doctoralia, iClinic)

## 🔄 Updates

To update the application:
```bash
git pull origin main
./scripts/deploy.sh production
```

## 🌍 Domain Configuration

The application is configured for `planton-sync.lovable.app`. To change domains:
1. Update `nginx/nginx.prod.conf` server_name
2. Update `DOMAIN` in environment variables
3. Reconfigure SSL certificates

---

**Note:** This deployment is optimized for Supabase integration. Ensure your Supabase project has all necessary tables, RLS policies, and edge functions configured.