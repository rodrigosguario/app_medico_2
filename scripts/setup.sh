#!/bin/bash
set -e

# MedicoAgenda Initial Setup Script

echo "🏥 Welcome to MedicoAgenda Setup!"
echo "=================================="

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version is too old. Please install Node.js 18 or higher."
    exit 1
fi
echo "✅ Node.js $(node --version) is installed"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi
echo "✅ npm $(npm --version) is installed"

# Check Docker (optional)
if command -v docker &> /dev/null; then
    echo "✅ Docker $(docker --version) is installed"
    DOCKER_AVAILABLE=true
else
    echo "⚠️  Docker is not installed (optional for development)"
    DOCKER_AVAILABLE=false
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed successfully"

# Setup environment
echo "⚙️  Setting up environment..."
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "📋 Created .env file from .env.example"
        echo "⚠️  Please edit .env file with your Supabase credentials"
    else
        echo "❌ .env.example file not found"
        exit 1
    fi
else
    echo "✅ .env file already exists"
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs uploads backups nginx/ssl monitoring/grafana/{dashboards,datasources}
echo "✅ Directories created"

# Make scripts executable
echo "🔧 Making scripts executable..."
chmod +x scripts/*.sh
echo "✅ Scripts are now executable"

# Setup Git hooks (if .git exists)
if [ -d ".git" ]; then
    echo "🔗 Setting up Git hooks..."
    # Add pre-commit hook for linting
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
npm run lint
EOF
    chmod +x .git/hooks/pre-commit
    echo "✅ Git hooks configured"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your Supabase credentials"
echo "2. Run 'npm run dev' to start development server"
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "3. Or run 'docker-compose up' to start with Docker"
fi
echo ""
echo "📚 For more information, check the README.md file"