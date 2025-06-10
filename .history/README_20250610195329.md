# 🚀 Hire me - AI powered resume analyser

An intelligent resume screening application built with React, TypeScript, and advanced AI models. Streamline your hiring process with AI-powered candidate analysis and smart matching algorithms.

![AI Resume Screener](https://img.shields.io/badge/AI-Powered-blue) ![React](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-CSS-blue)

## ✨ Features

- **🔍 PDF Resume Parsing**: Extract text from PDF resumes with high accuracy
- **🤖 AI-Powered Analysis**: Multiple AI models for comprehensive resume evaluation
- **🎯 Smart Matching**: Advanced algorithms to match candidates with job requirements
- **📊 Interactive Dashboard**: Beautiful UI for managing and reviewing candidates
- **⚡ Real-time Processing**: Fast and efficient resume analysis
- **📈 Detailed Analytics**: Comprehensive scoring and insights
- **🔒 Privacy First**: Local processing options available

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Components**: Radix UI, Shadcn/ui
- **AI Models**:
  - 🌟 Google Gemini Pro (Recommended)
  - 🧠 OpenAI GPT-4 (Premium)
  - 🔒 Local Models (Free)
- **PDF Processing**: PDF.js
- **Charts**: Recharts
- **Build Tool**: Vite
- **Deployment**: Vercel

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/hire-smart-ai-agent.git
cd hire-smart-ai-agent
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
```

4. **Add your API keys to `.env` (optional - local models work without keys):**
```env
# For Google Gemini (Recommended)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# For OpenAI (Premium)
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

5. **Start the development server:**
```bash
npm run dev
```

6. **Open your browser and visit:** `http://localhost:8080`

## 🤖 AI Model Options

### 🔒 Local Models (Default)
- ✅ Completely free and private
- ✅ Works offline
- ✅ Good accuracy for basic analysis
- ✅ No setup required

### 🌟 Google Gemini Pro (Recommended)
- ✅ Excellent accuracy and reasoning
- ✅ Cost-effective
- ✅ Fast processing
- ✅ Latest AI technology from Google

### 🧠 OpenAI GPT-4 (Premium)
- ✅ Highest accuracy available
- ✅ Most detailed analysis
- ⚠️ Higher cost

## 📖 Usage Guide

### 1. **Upload Resumes**
- Drag and drop PDF resumes or click to select files
- Supports multiple file uploads
- Automatic text extraction and parsing

### 2. **Create Job Description**
- Define role requirements and skills needed
- Set experience levels and education requirements
- Specify technical and soft skills

### 3. **AI Analysis**
- Choose your preferred AI model
- Start the automated analysis process
- Monitor real-time progress

### 4. **Review Results**
- View detailed candidate rankings
- Analyze individual candidate profiles
- Export results for further processing

## 🔑 API Keys Setup

### Google Gemini API (Recommended)
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file as `VITE_GEMINI_API_KEY`

### OpenAI API
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add it to your `.env` file as `VITE_OPENAI_API_KEY`

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub:**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Deploy to Vercel:**
   - Visit [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables:
     - `VITE_GEMINI_API_KEY`: Your Gemini API key
   - Deploy automatically

3. **Environment Variables in Vercel:**
   - Go to your project settings
   - Add environment variables
   - Redeploy if needed

## 🏗️ Build Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/hire-smart-ai-agent/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/hire-smart-ai-agent/discussions)

## 🙏 Acknowledgments

- Built with ❤️ using React and TypeScript
- UI components by Radix UI and Shadcn/ui
- AI powered by Google Gemini and OpenAI
- Icons by Lucide React

---

**Made with ❤️ for better hiring decisions**
