import { pipeline, env } from '@huggingface/transformers';
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import { PromptTemplate } from "@langchain/core/prompts";
import { Document } from "@langchain/core/documents";
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Configure transformers for browser use
env.allowRemoteModels = false;
env.allowLocalModels = true;

// Comprehensive job-specific skill database
const JOB_SKILL_DATABASE = {
  // Frontend Development
  'frontend': {
    core: ['html', 'css', 'javascript', 'typescript', 'react', 'vue', 'angular'],
    frameworks: ['react', 'vue.js', 'angular', 'svelte', 'next.js', 'nuxt.js', 'gatsby'],
    styling: ['css', 'sass', 'scss', 'less', 'styled-components', 'tailwind', 'bootstrap', 'material-ui', 'chakra-ui'],
    tools: ['webpack', 'vite', 'parcel', 'rollup', 'babel', 'eslint', 'prettier', 'npm', 'yarn', 'pnpm'],
    testing: ['jest', 'cypress', 'playwright', 'testing-library', 'vitest', 'mocha', 'jasmine'],
    state: ['redux', 'zustand', 'mobx', 'context-api', 'recoil', 'jotai'],
    mobile: ['react-native', 'flutter', 'ionic', 'cordova', 'phonegap']
  },

  // Backend Development
  'backend': {
    languages: ['node.js', 'python', 'java', 'c#', 'go', 'rust', 'php', 'ruby'],
    frameworks: ['express', 'fastify', 'nest.js', 'django', 'flask', 'spring', 'asp.net', 'gin', 'laravel', 'rails'],
    databases: ['mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'cassandra', 'dynamodb', 'sqlite'],
    cloud: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible'],
    apis: ['rest', 'graphql', 'grpc', 'websockets', 'microservices', 'api-gateway'],
    tools: ['git', 'jenkins', 'gitlab-ci', 'github-actions', 'docker', 'nginx', 'apache']
  },

  // Full Stack
  'fullstack': {
    frontend: ['html', 'css', 'javascript', 'typescript', 'react', 'vue', 'angular'],
    backend: ['node.js', 'python', 'java', 'express', 'django', 'spring'],
    databases: ['mongodb', 'postgresql', 'mysql', 'redis'],
    cloud: ['aws', 'azure', 'docker', 'kubernetes'],
    tools: ['git', 'webpack', 'docker', 'jenkins']
  },

  // Mobile Development
  'mobile': {
    native: ['swift', 'kotlin', 'java', 'objective-c', 'android', 'ios'],
    crossplatform: ['react-native', 'flutter', 'xamarin', 'ionic', 'cordova'],
    tools: ['xcode', 'android-studio', 'expo', 'fastlane'],
    testing: ['xctest', 'espresso', 'detox', 'appium']
  },

  // DevOps
  'devops': {
    cloud: ['aws', 'azure', 'gcp', 'digitalocean', 'linode'],
    containers: ['docker', 'kubernetes', 'podman', 'containerd'],
    cicd: ['jenkins', 'gitlab-ci', 'github-actions', 'azure-devops', 'circleci'],
    infrastructure: ['terraform', 'ansible', 'puppet', 'chef', 'cloudformation'],
    monitoring: ['prometheus', 'grafana', 'elk', 'datadog', 'newrelic'],
    scripting: ['bash', 'python', 'powershell', 'yaml', 'json']
  },

  // Data Science
  'data': {
    languages: ['python', 'r', 'sql', 'scala', 'julia'],
    libraries: ['pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'keras'],
    tools: ['jupyter', 'anaconda', 'spark', 'hadoop', 'airflow'],
    databases: ['postgresql', 'mongodb', 'cassandra', 'snowflake', 'bigquery'],
    visualization: ['matplotlib', 'seaborn', 'plotly', 'tableau', 'power-bi']
  },

  // UI/UX Design
  'design': {
    tools: ['figma', 'sketch', 'adobe-xd', 'photoshop', 'illustrator', 'invision'],
    skills: ['user-research', 'wireframing', 'prototyping', 'user-testing', 'design-systems'],
    frontend: ['html', 'css', 'javascript', 'responsive-design', 'accessibility']
  },

  // QA/Testing
  'qa': {
    manual: ['test-planning', 'test-cases', 'bug-reporting', 'regression-testing'],
    automation: ['selenium', 'cypress', 'playwright', 'testng', 'junit', 'pytest'],
    performance: ['jmeter', 'loadrunner', 'k6', 'gatling'],
    tools: ['jira', 'testlink', 'zephyr', 'postman', 'insomnia']
  }
};

// Enhanced skill synonyms and variations for better matching
const SKILL_SYNONYMS = {
  // Programming Languages
  'javascript': ['js', 'ecmascript', 'es6', 'es2015', 'es2020', 'es2021', 'vanilla js', 'vanilla javascript'],
  'typescript': ['ts', 'type script'],
  'python': ['py', 'python3', 'python2'],
  'java': ['jdk', 'jre', 'openjdk', 'oracle java'],
  'c#': ['csharp', 'c-sharp', 'c sharp', 'dotnet', '.net'],
  'c++': ['cpp', 'c plus plus'],
  'c': ['c language', 'ansi c'],
  'go': ['golang', 'go lang'],
  'rust': ['rust lang', 'rust language'],
  'php': ['php7', 'php8'],
  'ruby': ['ruby on rails', 'ror'],
  'swift': ['swift ui', 'swiftui'],
  'kotlin': ['kotlin jvm'],
  'scala': ['scala lang'],
  'r': ['r language', 'r programming'],

  // Frontend Frameworks
  'react': ['reactjs', 'react.js', 'react js', 'react native'],
  'vue': ['vue.js', 'vuejs', 'vue js'],
  'angular': ['angularjs', 'angular2', 'angular4', 'angular8', 'angular12', 'angular13', 'angular14', 'angular15'],
  'svelte': ['sveltejs', 'svelte js'],
  'next.js': ['nextjs', 'next js'],
  'nuxt.js': ['nuxtjs', 'nuxt js'],
  'gatsby': ['gatsbyjs', 'gatsby js'],

  // Backend Frameworks
  'node.js': ['nodejs', 'node', 'node js'],
  'express': ['express.js', 'expressjs', 'express js'],
  'nest.js': ['nestjs', 'nest js'],
  'django': ['django rest', 'drf'],
  'flask': ['flask python'],
  'spring': ['spring boot', 'spring framework', 'spring mvc'],
  'asp.net': ['aspnet', 'asp-net', 'asp net', '.net core', 'dotnet core'],
  'laravel': ['laravel php'],
  'rails': ['ruby on rails', 'ror'],
  'fastapi': ['fast api'],

  // Databases
  'mongodb': ['mongo', 'mongo db'],
  'postgresql': ['postgres', 'psql', 'postgre sql'],
  'mysql': ['my sql'],
  'sqlite': ['sqlite3'],
  'redis': ['redis cache'],
  'elasticsearch': ['elastic search', 'es'],
  'cassandra': ['apache cassandra'],
  'dynamodb': ['dynamo db', 'amazon dynamodb'],
  'oracle': ['oracle db', 'oracle database'],
  'sql server': ['mssql', 'microsoft sql server'],

  // Cloud & DevOps
  'aws': ['amazon-web-services', 'amazon-aws', 'amazon web services'],
  'azure': ['microsoft azure', 'azure cloud'],
  'gcp': ['google cloud', 'google cloud platform'],
  'docker': ['containerization', 'docker compose'],
  'kubernetes': ['k8s', 'k8'],
  'terraform': ['terraform cloud'],
  'ansible': ['ansible playbook'],
  'jenkins': ['jenkins ci', 'jenkins pipeline'],
  'github-actions': ['github-ci', 'gh-actions', 'github actions'],
  'gitlab-ci': ['gitlab-cicd', 'gitlab ci/cd'],
  'azure-devops': ['tfs', 'vsts', 'azure devops'],
  'circleci': ['circle ci'],

  // Mobile Development
  'react-native': ['reactnative', 'react native'],
  'flutter': ['flutter dart'],
  'ionic': ['ionic framework'],
  'xamarin': ['xamarin forms'],

  // Testing
  'jest': ['jest testing'],
  'cypress': ['cypress io'],
  'selenium': ['selenium webdriver'],
  'junit': ['junit5', 'junit4'],
  'pytest': ['py test'],
  'mocha': ['mocha js'],
  'jasmine': ['jasmine js'],

  // Tools & Others
  'git': ['github', 'gitlab', 'version control'],
  'webpack': ['webpack js'],
  'vite': ['vite js'],
  'babel': ['babel js'],
  'eslint': ['es lint'],
  'prettier': ['code formatter'],
  'npm': ['node package manager'],
  'yarn': ['yarn package manager'],
  'material-ui': ['mui', 'material-design', 'material design'],
  'styled-components': ['styled-jsx', 'emotion'],
  'tailwind': ['tailwindcss', 'tailwind css'],
  'bootstrap': ['bootstrap css'],
  'sass': ['scss'],
  'less': ['less css'],
  'graphql': ['graph ql'],
  'rest': ['rest api', 'restful'],
  'grpc': ['grpc api'],
  'websockets': ['web sockets', 'socket.io'],
  'microservices': ['micro services'],
  'api-gateway': ['api gateway']
};

interface ResumeAnalysis {
  overallScore: number;
  skillsMatch: number;
  experienceMatch: number;
  educationMatch: number;
  technicalFit: number;
  aiInsights: string;
  strengths: string[];
  concerns: string[];
  recommendation: string;
  detailedAnalysis: string;
  vectorSimilarity: number;
  matchedSkills: string[];
  missingSkills: string[];
}

interface JobDescription {
  jobTitle: string;
  department: string;
  experienceLevel: string;
  minExperience: string;
  maxExperience: string;
  requiredSkills: string;
  preferredSkills: string;
  education: string;
  jobDescription: string;
  responsibilities: string;
  companyInfo: string;
}

class LangChainLocalAnalyzer {
  private models: any = {};
  private embeddings: HuggingFaceTransformersEmbeddings | null = null;
  private textSplitter: RecursiveCharacterTextSplitter;
  private vectorStore: MemoryVectorStore | null = null;
  private isInitialized = false;

  constructor() {
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
  }

  async initializeModels(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      console.log('🚀 Initializing LangChain with local models...');

      // 1. Initialize embeddings for semantic similarity
      console.log('Loading embeddings model...');
      this.embeddings = new HuggingFaceTransformersEmbeddings({
        modelName: "Xenova/all-MiniLM-L6-v2",
      });

      // 2. Initialize sentiment analysis
      console.log('Loading sentiment analyzer...');
      this.models.sentimentAnalyzer = await pipeline(
        'sentiment-analysis',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
        { device: 'cpu', dtype: 'fp32' }
      );

      // 3. Initialize question answering for information extraction
      console.log('Loading question answering model...');
      this.models.questionAnswering = await pipeline(
        'question-answering',
        'Xenova/distilbert-base-cased-distilled-squad',
        { device: 'cpu', dtype: 'fp32' }
      );

      // 4. Initialize text summarization
      console.log('Loading summarization model...');
      this.models.summarizer = await pipeline(
        'summarization',
        'Xenova/distilbart-cnn-6-6',
        { device: 'cpu', dtype: 'fp32' }
      );

      console.log('✅ All LangChain local models initialized successfully!');
      this.isInitialized = true;
      return true;

    } catch (error) {
      console.error('❌ Failed to initialize LangChain local models:', error);
      return false;
    }
  }

  // Extract text from PDF using PDF.js
  async extractPDFText(file: File): Promise<string> {
    try {
      console.log(`📄 Extracting text from PDF: ${file.name}`);
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += pageText + '\n';
      }
      
      console.log(`✅ Extracted ${fullText.length} characters from PDF`);
      return fullText.trim();
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  // Extract text from various file formats
  async extractResumeText(file: File): Promise<string> {
    if (file.type === 'application/pdf') {
      return await this.extractPDFText(file);
    } else if (file.type.includes('text') || file.name.endsWith('.txt')) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string || '');
        reader.onerror = () => reject(new Error('Failed to read text file'));
        reader.readAsText(file);
      });
    } else {
      throw new Error(`File format ${file.type} not supported. Please use PDF or TXT files.`);
    }
  }

  // Create vector embeddings for job description using LangChain
  async createJobDescriptionVectors(jobDescription: JobDescription): Promise<void> {
    if (!this.embeddings) {
      throw new Error('Embeddings model not initialized');
    }

    console.log('🔍 Creating job description vectors with LangChain...');
    
    const jobText = `
Job Title: ${jobDescription.jobTitle}
Department: ${jobDescription.department}
Experience Level: ${jobDescription.experienceLevel}
Required Experience: ${jobDescription.minExperience} - ${jobDescription.maxExperience} years
Required Skills: ${jobDescription.requiredSkills}
Preferred Skills: ${jobDescription.preferredSkills}
Education: ${jobDescription.education}
Job Description: ${jobDescription.jobDescription}
Responsibilities: ${jobDescription.responsibilities}
Company Info: ${jobDescription.companyInfo}
    `.trim();

    // Split job description into chunks using LangChain text splitter
    const jobChunks = await this.textSplitter.splitText(jobText);
    
    // Create Document objects
    const documents = jobChunks.map((chunk, index) => 
      new Document({
        pageContent: chunk,
        metadata: { source: 'job_description', chunk: index }
      })
    );

    // Create vector store with LangChain
    this.vectorStore = await MemoryVectorStore.fromDocuments(
      documents,
      this.embeddings
    );

    console.log('✅ Job description vectors created with LangChain');
  }

  // Calculate semantic similarity using LangChain vector store
  async calculateVectorSimilarity(resumeText: string): Promise<number> {
    if (!this.vectorStore) {
      throw new Error('Job description vectors not initialized');
    }

    console.log('🔍 Calculating semantic similarity with LangChain...');

    // Split resume into chunks
    const resumeChunks = await this.textSplitter.splitText(resumeText);
    
    let totalSimilarity = 0;
    let chunkCount = 0;

    // Calculate similarity for each resume chunk against job description
    for (const chunk of resumeChunks.slice(0, 5)) { // Limit for performance
      try {
        const similarDocs = await this.vectorStore.similaritySearchWithScore(chunk, 3);
        
        if (similarDocs.length > 0) {
          // Convert distance to similarity score (0-1)
          const bestScore = Math.max(...similarDocs.map(([_, score]) => 1 - score));
          totalSimilarity += bestScore;
          chunkCount++;
        }
      } catch (error) {
        console.warn('Error calculating similarity for chunk:', error);
      }
    }

    const averageSimilarity = chunkCount > 0 ? totalSimilarity / chunkCount : 0;
    const normalizedScore = Math.min(100, Math.max(0, averageSimilarity * 100));
    
    console.log(`✅ Vector similarity calculated: ${normalizedScore.toFixed(2)}%`);
    return normalizedScore;
  }

  // Extract specific information using Question Answering model
  async extractInformationWithQA(resumeText: string): Promise<Record<string, string>> {
    if (!this.models.questionAnswering) {
      return {};
    }

    const questions = [
      "How many years of experience does this person have?",
      "What programming languages does this person know?",
      "What is this person's education background?",
      "What companies has this person worked for?",
      "What projects has this person worked on?",
      "What certifications does this person have?"
    ];

    const results: Record<string, string> = {};
    
    for (const question of questions) {
      try {
        const answer = await this.models.questionAnswering({
          question,
          context: resumeText.substring(0, 2000) // Limit context for performance
        });
        
        if (answer.score > 0.1) { // Only use answers with reasonable confidence
          results[question] = answer.answer;
        }
      } catch (error) {
        console.warn(`Error answering question "${question}":`, error);
      }
    }

    return results;
  }

  // Analyze communication skills using sentiment analysis
  async analyzeCommunicationSkills(resumeText: string): Promise<{ score: number; analysis: string }> {
    if (!this.models.sentimentAnalyzer) {
      return { score: 75, analysis: "Communication analysis not available" };
    }

    try {
      // Analyze different sections of the resume
      const sections = [
        resumeText.substring(0, 500),   // Introduction/Summary
        resumeText.substring(500, 1000), // Experience section
        resumeText.substring(1000, 1500) // Skills/Education section
      ].filter(section => section.trim().length > 50);

      let totalScore = 0;
      let positiveCount = 0;
      
      for (const section of sections) {
        const sentiment = await this.models.sentimentAnalyzer(section);
        if (sentiment && sentiment[0]) {
          const isPositive = sentiment[0].label === 'POSITIVE';
          const confidence = sentiment[0].score;
          
          if (isPositive) {
            totalScore += 70 + (confidence * 25);
            positiveCount++;
          } else {
            totalScore += 50 + (confidence * 15);
          }
        }
      }

      const averageScore = sections.length > 0 ? totalScore / sections.length : 75;
      const finalScore = Math.min(95, Math.max(50, Math.round(averageScore)));
      
      const analysis = `LangChain sentiment analysis: ${positiveCount}/${sections.length} sections show positive communication patterns.`;
      
      return { score: finalScore, analysis };
    } catch (error) {
      console.warn('Communication analysis failed:', error);
      return { score: 75, analysis: "Communication analysis completed with fallback method" };
    }
  }

  // Generate AI insights using summarization
  async generateAIInsights(resumeText: string, jobTitle: string, extractedInfo: Record<string, string>): Promise<string> {
    if (!this.models.summarizer) {
      return `LangChain analysis completed for ${jobTitle} position. Key findings: ${Object.values(extractedInfo).slice(0, 2).join('; ')}`;
    }

    try {
      // Prepare comprehensive text for summarization
      const analysisText = `
Resume Analysis for ${jobTitle}:
${resumeText.substring(0, 800)}

Key Information Extracted:
${Object.entries(extractedInfo).map(([q, a]) => `${q}: ${a}`).join('\n')}
      `.trim();
      
      const summary = await this.models.summarizer(analysisText, {
        max_length: 150,
        min_length: 50,
        do_sample: false
      });

      return summary[0]?.summary_text || `LangChain analysis completed for ${jobTitle} with comprehensive AI insights.`;
    } catch (error) {
      console.warn('AI insights generation failed:', error);
      return `LangChain analysis completed for ${jobTitle} position using advanced local models with semantic similarity and information extraction.`;
    }
  }

  // Detect job role from job title and description
  detectJobRole(jobTitle: string, jobDescription: string): string[] {
    const text = `${jobTitle} ${jobDescription}`.toLowerCase();
    const detectedRoles = [];

    // Check for specific role keywords
    if (text.includes('frontend') || text.includes('front-end') || text.includes('ui developer') || text.includes('react developer') || text.includes('vue developer')) {
      detectedRoles.push('frontend');
    }
    if (text.includes('backend') || text.includes('back-end') || text.includes('api developer') || text.includes('server') || text.includes('node.js developer')) {
      detectedRoles.push('backend');
    }
    if (text.includes('fullstack') || text.includes('full-stack') || text.includes('full stack')) {
      detectedRoles.push('fullstack');
    }
    if (text.includes('mobile') || text.includes('android') || text.includes('ios') || text.includes('react native') || text.includes('flutter')) {
      detectedRoles.push('mobile');
    }
    if (text.includes('devops') || text.includes('sre') || text.includes('infrastructure') || text.includes('cloud engineer')) {
      detectedRoles.push('devops');
    }
    if (text.includes('data scientist') || text.includes('data analyst') || text.includes('machine learning') || text.includes('ai engineer')) {
      detectedRoles.push('data');
    }
    if (text.includes('designer') || text.includes('ui/ux') || text.includes('user experience') || text.includes('user interface')) {
      detectedRoles.push('design');
    }
    if (text.includes('qa') || text.includes('tester') || text.includes('quality assurance') || text.includes('test engineer')) {
      detectedRoles.push('qa');
    }

    // Default to fullstack if no specific role detected
    return detectedRoles.length > 0 ? detectedRoles : ['fullstack'];
  }

  // Get relevant skills for detected job roles
  getRelevantSkillsForRole(roles: string[]): string[] {
    const allSkills = new Set<string>();

    roles.forEach(role => {
      const roleSkills = JOB_SKILL_DATABASE[role];
      if (roleSkills) {
        Object.values(roleSkills).forEach(skillArray => {
          if (Array.isArray(skillArray)) {
            skillArray.forEach(skill => allSkills.add(skill));
          }
        });
      }
    });

    return Array.from(allSkills);
  }

  // Parse skills from text with better handling
  private parseSkillsFromText(text: string): string[] {
    if (!text || text.trim() === '') {
      return [];
    }

    // Split by common delimiters and clean up
    const skills = text.toLowerCase()
      .split(/[,;|\n\r]+/)
      .map(s => s.trim())
      .filter(s => s.length > 1)
      .filter(s => !s.match(/^(and|or|with|using|including|such as|like|etc)$/));

    return [...new Set(skills)]; // Remove duplicates
  }

  // Advanced skill finding with context awareness and pattern matching
  private findSkillInResume(skill: string, resumeText: string): { found: boolean; context: string; confidence: number } {
    const resumeLower = resumeText.toLowerCase();
    const skillLower = skill.toLowerCase();

    // Get all possible variations of the skill
    const skillVariations = [skillLower, ...(SKILL_SYNONYMS[skillLower] || [])];

    let bestMatch = { found: false, context: '', confidence: 0 };

    for (const variation of skillVariations) {
      const match = this.searchSkillPattern(variation, resumeLower, resumeText);
      if (match.found && match.confidence > bestMatch.confidence) {
        bestMatch = match;
      }
    }

    return bestMatch;
  }

  // Search for skill patterns with different matching strategies
  private searchSkillPattern(skill: string, resumeLower: string, originalText: string): { found: boolean; context: string; confidence: number } {
    // Strategy 1: Exact word boundary match (highest confidence)
    const wordBoundaryRegex = new RegExp(`\\b${this.escapeRegex(skill)}\\b`, 'gi');
    const wordBoundaryMatch = originalText.match(wordBoundaryRegex);
    if (wordBoundaryMatch) {
      const context = this.extractContext(skill, originalText);
      return { found: true, context, confidence: 0.95 };
    }

    // Strategy 2: Exact phrase match (high confidence)
    if (resumeLower.includes(skill)) {
      const context = this.extractContext(skill, originalText);
      return { found: true, context, confidence: 0.85 };
    }

    // Strategy 3: Partial match with common variations (medium confidence)
    const partialPatterns = [
      `${skill}js`,     // e.g., "reactjs" for "react"
      `${skill}.js`,    // e.g., "react.js" for "react"
      `${skill} js`,    // e.g., "react js" for "react"
      skill.replace(/\./g, ''), // e.g., "nodejs" for "node.js"
      skill.replace(/\s+/g, ''), // e.g., "reactnative" for "react native"
    ];

    for (const pattern of partialPatterns) {
      if (resumeLower.includes(pattern)) {
        const context = this.extractContext(pattern, originalText);
        return { found: true, context, confidence: 0.75 };
      }
    }

    // Strategy 4: Fuzzy match for common misspellings (lower confidence)
    const fuzzyMatch = this.fuzzySkillMatch(skill, resumeLower);
    if (fuzzyMatch.found) {
      return { found: true, context: fuzzyMatch.context, confidence: 0.6 };
    }

    return { found: false, context: '', confidence: 0 };
  }

  // Extract context around found skill
  private extractContext(skill: string, text: string): string {
    const index = text.toLowerCase().indexOf(skill.toLowerCase());
    if (index === -1) return '';

    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + skill.length + 50);
    return text.substring(start, end).trim();
  }

  // Escape special regex characters
  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Fuzzy matching for common misspellings and variations
  private fuzzySkillMatch(skill: string, resumeLower: string): { found: boolean; context: string } {
    // Common programming language variations
    const fuzzyPatterns: { [key: string]: string[] } = {
      'javascript': ['java script', 'java-script', 'jscript'],
      'typescript': ['type script', 'type-script'],
      'react': ['react.js', 'reactjs', 'react-js'],
      'vue': ['vue.js', 'vuejs', 'vue-js'],
      'angular': ['angular.js', 'angularjs', 'angular-js'],
      'node.js': ['nodejs', 'node-js', 'node js'],
      'python': ['python3', 'python2', 'py'],
      'c#': ['csharp', 'c-sharp', 'c sharp'],
      'c++': ['cpp', 'c plus plus', 'cplusplus'],
    };

    const patterns = fuzzyPatterns[skill] || [];
    for (const pattern of patterns) {
      if (resumeLower.includes(pattern)) {
        return { found: true, context: pattern };
      }
    }

    return { found: false, context: '' };
  }

  // Enhanced comprehensive skills matching with advanced pattern recognition
  async calculateJobSpecificSkillsMatch(resumeText: string, requiredSkills: string, jobTitle: string, jobDescription: string): Promise<{
    score: number;
    matchedSkills: string[];
    missingSkills: string[];
    technicalFit: number;
  }> {
    console.log('🎯 Starting comprehensive skills analysis...');

    // Detect job role
    const detectedRoles = this.detectJobRole(jobTitle, jobDescription);
    console.log('Detected job roles:', detectedRoles);

    // Get relevant skills for the role
    const roleRelevantSkills = this.getRelevantSkillsForRole(detectedRoles);
    console.log('Role-relevant skills:', roleRelevantSkills.slice(0, 10), '...');

    // Parse required skills with better handling
    const explicitSkills = this.parseSkillsFromText(requiredSkills);

    // Also parse preferred skills if available
    const preferredSkills = this.parseSkillsFromText(jobDescription);

    // Combine all relevant skills
    const allRelevantSkills = [...new Set([...explicitSkills, ...preferredSkills, ...roleRelevantSkills])];

    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];
    const skillMatchDetails: { [key: string]: { found: boolean; context: string; confidence: number } } = {};

    console.log(`Analyzing ${allRelevantSkills.length} relevant skills with advanced pattern matching...`);

    // Enhanced skill matching with context awareness
    allRelevantSkills.forEach(skill => {
      const matchResult = this.findSkillInResume(skill, resumeText);

      if (matchResult.found) {
        matchedSkills.push(skill);
        skillMatchDetails[skill] = matchResult;
      } else if (explicitSkills.includes(skill)) {
        missingSkills.push(skill);
        skillMatchDetails[skill] = { found: false, context: '', confidence: 0 };
      }
    });

    // Remove duplicates and sort by confidence
    const uniqueMatchedSkills = [...new Set(matchedSkills)];
    const sortedMatchedSkills = uniqueMatchedSkills.sort((a, b) => {
      const confA = skillMatchDetails[a]?.confidence || 0;
      const confB = skillMatchDetails[b]?.confidence || 0;
      return confB - confA;
    });

    // Calculate weighted scores based on confidence
    const explicitSkillsMatched = explicitSkills.filter(skill => uniqueMatchedSkills.includes(skill)).length;
    const explicitSkillsScore = explicitSkills.length > 0 ? (explicitSkillsMatched / explicitSkills.length) * 100 : 80;

    const roleSkillsMatched = roleRelevantSkills.filter(skill => uniqueMatchedSkills.includes(skill)).length;
    const roleSkillsScore = roleRelevantSkills.length > 0 ? (roleSkillsMatched / roleRelevantSkills.length) * 100 : 70;

    // Calculate confidence-weighted technical fit
    const totalConfidence = uniqueMatchedSkills.reduce((sum, skill) => {
      return sum + (skillMatchDetails[skill]?.confidence || 0);
    }, 0);
    const averageConfidence = uniqueMatchedSkills.length > 0 ? totalConfidence / uniqueMatchedSkills.length : 0;
    const confidenceBonus = averageConfidence * 10; // Up to 10 point bonus for high confidence matches

    const technicalFit = Math.round(Math.min(95, roleSkillsScore + confidenceBonus));

    // Overall skills score (weighted: 60% explicit, 25% role-relevant, 15% confidence)
    const overallScore = Math.round(
      (explicitSkillsScore * 0.6) +
      (roleSkillsScore * 0.25) +
      (confidenceBonus * 1.5)
    );

    // Enhanced logging with confidence details
    console.log(`Enhanced Skills Analysis Results:`);
    console.log(`- Explicit skills: ${explicitSkillsMatched}/${explicitSkills.length} (${explicitSkillsScore.toFixed(1)}%)`);
    console.log(`- Role skills: ${roleSkillsMatched}/${roleRelevantSkills.length} (${roleSkillsScore.toFixed(1)}%)`);
    console.log(`- Average confidence: ${(averageConfidence * 100).toFixed(1)}%`);
    console.log(`- Technical fit: ${technicalFit}%`);
    console.log(`- Overall score: ${Math.min(95, overallScore)}%`);
    console.log(`- High-confidence matches:`, sortedMatchedSkills.slice(0, 8));
    console.log(`- Missing critical skills:`, missingSkills.slice(0, 5));

    return {
      score: Math.min(95, overallScore),
      matchedSkills: sortedMatchedSkills.slice(0, 15), // Top matches by confidence
      missingSkills: missingSkills.slice(0, 10),
      technicalFit
    };
  }

  // Basic skills matching (fallback)
  private calculateBasicSkillsMatch(resumeText: string, requiredSkills: string): number {
    if (!requiredSkills || requiredSkills.trim() === '') {
      return 75;
    }

    const skills = requiredSkills.toLowerCase().split(',').map(s => s.trim()).filter(s => s.length > 0);
    const resumeLower = resumeText.toLowerCase();

    let matchCount = 0;
    for (const skill of skills) {
      if (resumeLower.includes(skill)) {
        matchCount++;
      }
    }

    const matchPercentage = skills.length > 0 ? matchCount / skills.length : 0;
    return Math.min(95, Math.round(30 + (matchPercentage * 65)));
  }

  // Main analysis function using LangChain
  async analyzeResumeWithLangChain(resumeFile: File, jobDescription: JobDescription): Promise<ResumeAnalysis> {
    if (!this.isInitialized) {
      await this.initializeModels();
    }

    try {
      console.log('🚀 Starting LangChain-powered resume analysis...');

      // Step 1: Extract text from resume
      const resumeText = await this.extractResumeText(resumeFile);
      
      // Step 2: Create job description vectors
      await this.createJobDescriptionVectors(jobDescription);

      // Step 3: Extract information using Q&A
      const extractedInfo = await this.extractInformationWithQA(resumeText);

      // Step 4: Enhanced job-specific skills analysis with preferred skills
      const skillsAnalysis = await this.calculateJobSpecificSkillsMatch(
        resumeText,
        `${jobDescription.requiredSkills}, ${jobDescription.preferredSkills}`,
        jobDescription.jobTitle,
        jobDescription.jobDescription
      );

      // Step 5: Calculate other scores
      const experienceMatch = this.calculateExperienceMatch(resumeText, jobDescription, extractedInfo);
      const educationMatch = this.calculateEducationMatch(resumeText, jobDescription.education);
      const vectorSimilarity = await this.calculateVectorSimilarity(resumeText);

      // Step 6: Generate AI insights
      const aiInsights = await this.generateAIInsights(resumeText, jobDescription.jobTitle, extractedInfo);

      // Step 7: Calculate overall score (removed communication, added technical fit)
      const overallScore = Math.round(
        (skillsAnalysis.score * 0.4 + experienceMatch * 0.3 + skillsAnalysis.technicalFit * 0.2 + educationMatch * 0.1)
      );

      // Step 8: Generate recommendation
      const recommendation = overallScore >= 85 ? "Highly Recommended" :
                           overallScore >= 75 ? "Recommended" :
                           overallScore >= 65 ? "Consider" :
                           "Not Recommended";

      // Step 9: Generate strengths and concerns
      const strengths = this.generateJobSpecificStrengths(skillsAnalysis, experienceMatch, educationMatch, vectorSimilarity);
      const concerns = this.generateJobSpecificConcerns(skillsAnalysis, experienceMatch, educationMatch);

      const result: ResumeAnalysis = {
        overallScore,
        skillsMatch: skillsAnalysis.score,
        experienceMatch,
        educationMatch,
        technicalFit: skillsAnalysis.technicalFit,
        vectorSimilarity,
        matchedSkills: skillsAnalysis.matchedSkills,
        missingSkills: skillsAnalysis.missingSkills,
        aiInsights: `${aiInsights} Technical fit: ${skillsAnalysis.technicalFit}%. Vector similarity: ${vectorSimilarity.toFixed(1)}%. Matched ${skillsAnalysis.matchedSkills.length} relevant skills.`,
        strengths,
        concerns,
        recommendation,
        detailedAnalysis: `Job-specific LangChain analysis for ${jobDescription.jobTitle}. Matched skills: ${skillsAnalysis.matchedSkills.slice(0, 5).join(', ')}. Key findings: ${Object.entries(extractedInfo).slice(0, 2).map(([q, a]) => `${q}: ${a}`).join('; ')}`
      };

      console.log('✅ LangChain analysis completed:', result);
      return result;

    } catch (error) {
      console.error('LangChain analysis failed:', error);
      throw new Error(`LangChain analysis failed: ${error.message}`);
    }
  }

  // Helper methods for scoring
  private calculateExperienceMatch(resumeText: string, jobDescription: JobDescription, extractedInfo: Record<string, string>): number {
    // Enhanced with Q&A extracted information
    const yearMatches = resumeText.match(/(\d+)\s*\+?\s*years?/gi) || [];
    const maxExperience = yearMatches.length > 0 ? Math.max(...yearMatches.map(m => parseInt(m.match(/\d+/)?.[0] || '0'))) : 0;
    
    const minRequired = parseInt(jobDescription.minExperience) || 0;
    const maxRequired = parseInt(jobDescription.maxExperience) || 10;
    
    let score = 50;
    if (maxExperience >= minRequired && maxExperience <= maxRequired + 2) {
      score += 35;
    } else if (maxExperience > 0) {
      score += 20;
    }
    
    // Bonus from extracted information
    const experienceInfo = extractedInfo["How many years of experience does this person have?"];
    if (experienceInfo && experienceInfo.includes('year')) {
      score += 10;
    }
    
    return Math.min(95, score);
  }

  private calculateEducationMatch(resumeText: string, requiredEducation: string): number {
    const resumeLower = resumeText.toLowerCase();
    const educationKeywords = ['bachelor', 'master', 'phd', 'degree', 'university', 'college', 'certification'];
    
    let score = 50;
    for (const keyword of educationKeywords) {
      if (resumeLower.includes(keyword)) {
        score += 8;
      }
    }
    
    return Math.min(95, score);
  }

  private generateJobSpecificStrengths(skillsAnalysis: any, experienceMatch: number, educationMatch: number, vectorSimilarity: number): string[] {
    const strengths = [];

    // Skills-based strengths
    if (skillsAnalysis.score >= 85) {
      strengths.push(`Excellent skill match (${skillsAnalysis.matchedSkills.length} relevant skills found)`);
    } else if (skillsAnalysis.score >= 70) {
      strengths.push(`Good technical skill alignment`);
    }

    // Technical fit strengths
    if (skillsAnalysis.technicalFit >= 80) {
      strengths.push("Strong technical fit for the role");
    } else if (skillsAnalysis.technicalFit >= 65) {
      strengths.push("Adequate technical background");
    }

    // Specific skill highlights
    if (skillsAnalysis.matchedSkills.length > 0) {
      const topSkills = skillsAnalysis.matchedSkills.slice(0, 3);
      strengths.push(`Proficient in key technologies: ${topSkills.join(', ')}`);
    }

    // Experience strengths
    if (experienceMatch >= 80) {
      strengths.push("Strong relevant work experience");
    } else if (experienceMatch >= 65) {
      strengths.push("Relevant industry experience");
    }

    // Education strengths
    if (educationMatch >= 80) {
      strengths.push("Strong educational foundation");
    }

    // Semantic similarity
    if (vectorSimilarity >= 75) {
      strengths.push("High semantic match to job requirements");
    }

    return strengths.length > 0 ? strengths : ["Shows potential for the role"];
  }

  private generateJobSpecificConcerns(skillsAnalysis: any, experienceMatch: number, educationMatch: number): string[] {
    const concerns = [];

    // Missing critical skills
    if (skillsAnalysis.missingSkills.length > 0) {
      const criticalMissing = skillsAnalysis.missingSkills.slice(0, 3);
      concerns.push(`Missing key skills: ${criticalMissing.join(', ')}`);
    }

    // Low technical fit
    if (skillsAnalysis.technicalFit < 50) {
      concerns.push("Limited technical fit for the specific role");
    } else if (skillsAnalysis.technicalFit < 65) {
      concerns.push("Some technical skill gaps identified");
    }

    // Overall skills concerns
    if (skillsAnalysis.score < 60) {
      concerns.push("Significant skill gaps in required areas");
    } else if (skillsAnalysis.score < 70) {
      concerns.push("Some important skills may be missing");
    }

    // Experience concerns
    if (experienceMatch < 60) {
      concerns.push("Limited relevant work experience");
    } else if (experienceMatch < 70) {
      concerns.push("Experience level may not fully meet requirements");
    }

    // Education concerns
    if (educationMatch < 60) {
      concerns.push("Educational background may not align with role requirements");
    }

    return concerns;
  }
}

// Export singleton instance
export const langchainLocalAnalyzer = new LangChainLocalAnalyzer();
export type { ResumeAnalysis, JobDescription };
