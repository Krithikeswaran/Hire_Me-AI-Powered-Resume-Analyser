#!/bin/bash

# Hire Smart AI Agent - Deployment Script
# This script helps you deploy the application to Vercel

echo "🚀 Hire Smart AI Agent - Deployment Script"
echo "=========================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📝 Initializing Git repository..."
    git init
    git branch -M main
fi

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "📦 Adding and committing changes..."
    git add .
    git commit -m "Deploy: Update application for production"
else
    echo "✅ No uncommitted changes found"
fi

# Build the application
echo "🏗️  Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed! Please fix the errors and try again."
    exit 1
fi

echo ""
echo "🎉 Ready for deployment!"
echo ""
echo "Next steps:"
echo "1. Push to GitHub: git push origin main"
echo "2. Go to https://vercel.com"
echo "3. Import your GitHub repository"
echo "4. Add environment variables:"
echo "   - VITE_GEMINI_API_KEY: Your Gemini API key"
echo "5. Deploy!"
echo ""
echo "Environment variables needed in Vercel:"
echo "- VITE_GEMINI_API_KEY (required for AI features)"
echo ""
echo "🔗 Your app will be available at: https://your-app-name.vercel.app"
