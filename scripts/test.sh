#!/bin/bash

# Basic smoke tests for MedicoAgenda production readiness
echo "🧪 Running MedicoAgenda production readiness tests..."

# Test 1: Check environment variables
echo "✅ Testing environment variables..."
if [ -z "$VITE_SUPABASE_URL" ]; then
    echo "❌ VITE_SUPABASE_URL not set"
    exit 1
fi

if [ -z "$VITE_SUPABASE_PUBLISHABLE_KEY" ]; then
    echo "❌ VITE_SUPABASE_PUBLISHABLE_KEY not set"
    exit 1
fi

echo "✅ Environment variables configured"

# Test 2: Check if build works
echo "✅ Testing build process..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi
echo "✅ Build successful"

# Test 3: Check critical files exist
echo "✅ Testing file structure..."
required_files=(
    "dist/index.html"
    "src/pages/Index.tsx"
    "src/pages/Dashboard.tsx"
    "src/pages/CalendarPage.tsx"
    "src/pages/FinancialPage.tsx"
    "src/components/Navigation.tsx"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Required file missing: $file"
        exit 1
    fi
done

echo "✅ All critical files present"

# Test 4: Check Docker build
echo "✅ Testing Docker build..."
docker build -t medicoagenda-test .
if [ $? -ne 0 ]; then
    echo "❌ Docker build failed"
    exit 1
fi
echo "✅ Docker build successful"

# Test 5: Basic container smoke test
echo "✅ Testing container startup..."
container_id=$(docker run -d -p 8081:80 medicoagenda-test)
sleep 5

# Check if container is running
if ! docker ps | grep $container_id > /dev/null; then
    echo "❌ Container failed to start"
    docker logs $container_id
    docker rm -f $container_id
    exit 1
fi

# Test basic HTTP response
if ! curl -f http://localhost:8081/health; then
    echo "❌ Health check failed"
    docker logs $container_id
    docker rm -f $container_id
    exit 1
fi

# Cleanup
docker rm -f $container_id
docker rmi medicoagenda-test

echo "🎉 All tests passed! MedicoAgenda is production ready."