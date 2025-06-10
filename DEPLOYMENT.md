# 🚀 Deployment Guide - Hire Smart AI Agent

This guide will help you deploy your AI-powered resume analyser to Vercel with GitHub integration.

## 📋 Prerequisites

- ✅ GitHub account
- ✅ Vercel account (free tier available)
- ✅ Gemini API key (from Google AI Studio)
- ✅ Git installed on your computer

## 🔧 Step 1: Prepare Your API Key

### Get Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key (starts with `AIzaSy...`)
5. Keep it secure - you'll need it for deployment

## 📤 Step 2: Push to GitHub

### Create GitHub Repository
1. Go to [GitHub](https://github.com) and sign in
2. Click "New repository" (green button)
3. Repository name: `hire-smart-ai-agent`
4. Description: `AI-powered resume analyser with smart matching algorithms`
5. Set to **Public** (required for free Vercel deployment)
6. **Don't** initialize with README (we already have one)
7. Click "Create repository"

### Push Your Code
```bash
# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/hire-smart-ai-agent.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## 🌐 Step 3: Deploy to Vercel

### Connect to Vercel
1. Go to [Vercel](https://vercel.com)
2. Sign up/Sign in (use GitHub account for easier integration)
3. Click "New Project"
4. Import your `hire-smart-ai-agent` repository
5. Click "Import"

### Configure Project Settings
1. **Framework Preset**: Vite (should auto-detect)
2. **Root Directory**: `./` (default)
3. **Build Command**: `npm run build` (default)
4. **Output Directory**: `dist` (default)

### Add Environment Variables
**IMPORTANT**: Add your API key in Vercel settings:

1. In project settings, go to "Environment Variables"
2. Add the following variable:
   - **Name**: `VITE_GEMINI_API_KEY`
   - **Value**: Your Gemini API key (the one starting with `AIzaSy...`)
   - **Environment**: All (Production, Preview, Development)
3. Click "Save"

### Deploy
1. Click "Deploy"
2. Wait for deployment to complete (usually 2-3 minutes)
3. Your app will be available at: `https://your-project-name.vercel.app`

## ✅ Step 4: Verify Deployment

### Test Your Application
1. Visit your deployed URL
2. Try uploading a resume (PDF)
3. Create a job description
4. Run AI analysis
5. Check that Gemini API is working (should show better accuracy than local models)

### Check Logs (if issues occur)
1. Go to Vercel dashboard
2. Click on your project
3. Go to "Functions" tab
4. Check logs for any errors

## 🔄 Step 5: Automatic Deployments

Once connected, Vercel will automatically deploy when you:
- Push to the `main` branch
- Create pull requests (preview deployments)

### Update Your App
```bash
# Make changes to your code
git add .
git commit -m "Update: description of changes"
git push origin main
```

Vercel will automatically redeploy!

## 🛠️ Troubleshooting

### Common Issues

#### Build Fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript types are correct

#### API Key Not Working
- Verify the environment variable name: `VITE_GEMINI_API_KEY`
- Check the API key is valid and active
- Ensure the key has proper permissions

#### Large Bundle Size Warning
- This is normal due to AI/ML libraries
- The app will still work fine
- Consider code splitting for optimization

### Environment Variables
Make sure these are set in Vercel:
- `VITE_GEMINI_API_KEY`: Your Gemini API key

### Performance Tips
- Use Gemini API for best accuracy
- Local models work but are slower
- Consider upgrading Vercel plan for better performance

## 📊 Monitoring

### Analytics
- Vercel provides built-in analytics
- Monitor usage and performance
- Track API usage in Google AI Studio

### Updates
- Keep dependencies updated
- Monitor for security updates
- Test new features in preview deployments

## 🎉 Success!

Your AI-powered resume analyser is now live! Share the URL with:
- Recruiters and HR teams
- Job seekers for resume optimization
- Anyone who needs intelligent candidate screening

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test locally first: `npm run dev`
4. Check GitHub repository for updates

---

**🎯 Your app is now live and ready to help with intelligent hiring decisions!**
