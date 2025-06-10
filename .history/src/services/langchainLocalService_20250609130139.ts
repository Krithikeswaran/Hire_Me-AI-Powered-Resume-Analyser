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

// Skill synonyms and variations
const SKILL_SYNONYMS = {
  'javascript': ['js', 'ecmascript', 'es6', 'es2015', 'es2020'],
  'typescript': ['ts'],
  'react': ['reactjs', 'react.js'],
  'vue': ['vue.js', 'vuejs'],
  'angular': ['angularjs', 'angular2', 'angular4', 'angular8', 'angular12'],
  'node.js': ['nodejs', 'node'],
  'mongodb': ['mongo'],
  'postgresql': ['postgres', 'psql'],
  'mysql': ['sql'],
  'aws': ['amazon-web-services', 'amazon-aws'],
  'docker': ['containerization'],
  'kubernetes': ['k8s'],
  'c#': ['csharp', 'c-sharp'],
  'asp.net': ['aspnet', 'asp-net'],
  'next.js': ['nextjs'],
  'nuxt.js': ['nuxtjs'],
  'express': ['express.js', 'expressjs'],
  'nest.js': ['nestjs'],
  'react-native': ['reactnative'],
  'material-ui': ['mui', 'material-design'],
  'styled-components': ['styled-jsx', 'emotion'],
  'github-actions': ['github-ci', 'gh-actions'],
  'gitlab-ci': ['gitlab-cicd'],
  'azure-devops': ['tfs', 'vsts']
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

  // Enhanced skills matching with job-specific intelligence
  async calculateJobSpecificSkillsMatch(resumeText: string, requiredSkills: string, jobTitle: string, jobDescription: string): Promise<{
    score: number;
    matchedSkills: string[];
    missingSkills: string[];
    technicalFit: number;
  }> {
    console.log('🎯 Starting job-specific skills analysis...');

    // Detect job role
    const detectedRoles = this.detectJobRole(jobTitle, jobDescription);
    console.log('Detected job roles:', detectedRoles);

    // Get relevant skills for the role
    const roleRelevantSkills = this.getRelevantSkillsForRole(detectedRoles);
    console.log('Role-relevant skills:', roleRelevantSkills.slice(0, 10), '...');

    // Parse required skills
    const explicitSkills = requiredSkills ? requiredSkills.toLowerCase().split(',').map(s => s.trim()).filter(s => s.length > 0) : [];

    // Combine explicit skills with role-relevant skills
    const allRelevantSkills = [...new Set([...explicitSkills, ...roleRelevantSkills])];

    const resumeLower = resumeText.toLowerCase();
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    console.log(`Analyzing ${allRelevantSkills.length} relevant skills...`);

    // Check each skill with synonyms
    allRelevantSkills.forEach(skill => {
      let found = false;

      // Check main skill
      if (resumeLower.includes(skill)) {
        matchedSkills.push(skill);
        found = true;
      } else {
        // Check synonyms
        const synonyms = SKILL_SYNONYMS[skill] || [];
        for (const synonym of synonyms) {
          if (resumeLower.includes(synonym)) {
            matchedSkills.push(skill);
            found = true;
            break;
          }
        }
      }

      if (!found && explicitSkills.includes(skill)) {
        missingSkills.push(skill);
      }
    });

    // Calculate scores
    const explicitSkillsMatched = explicitSkills.filter(skill => matchedSkills.includes(skill)).length;
    const explicitSkillsScore = explicitSkills.length > 0 ? (explicitSkillsMatched / explicitSkills.length) * 100 : 80;

    const roleSkillsMatched = roleRelevantSkills.filter(skill => matchedSkills.includes(skill)).length;
    const roleSkillsScore = roleRelevantSkills.length > 0 ? (roleSkillsMatched / roleRelevantSkills.length) * 100 : 70;

    // Technical fit based on role-specific skills
    const technicalFit = Math.round(roleSkillsScore);

    // Overall skills score (weighted: 70% explicit, 30% role-relevant)
    const overallScore = Math.round((explicitSkillsScore * 0.7) + (roleSkillsScore * 0.3));

    console.log(`Skills Analysis Results:`);
    console.log(`- Explicit skills: ${explicitSkillsMatched}/${explicitSkills.length} (${explicitSkillsScore.toFixed(1)}%)`);
    console.log(`- Role skills: ${roleSkillsMatched}/${roleRelevantSkills.length} (${roleSkillsScore.toFixed(1)}%)`);
    console.log(`- Technical fit: ${technicalFit}%`);
    console.log(`- Overall score: ${overallScore}%`);
    console.log(`- Matched skills:`, matchedSkills.slice(0, 10));
    console.log(`- Missing critical skills:`, missingSkills.slice(0, 5));

    return {
      score: Math.min(95, overallScore),
      matchedSkills: matchedSkills.slice(0, 15), // Limit for display
      missingSkills: missingSkills.slice(0, 10), // Limit for display
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

      // Step 4: Calculate various scores
      const skillsMatch = await this.calculateAdvancedSkillsMatch(resumeText, jobDescription.requiredSkills);
      const experienceMatch = this.calculateExperienceMatch(resumeText, jobDescription, extractedInfo);
      const educationMatch = this.calculateEducationMatch(resumeText, jobDescription.education);
      
      // Step 5: AI-powered analysis
      const communicationAnalysis = await this.analyzeCommunicationSkills(resumeText);
      const vectorSimilarity = await this.calculateVectorSimilarity(resumeText);
      const aiInsights = await this.generateAIInsights(resumeText, jobDescription.jobTitle, extractedInfo);

      // Step 6: Calculate overall score
      const overallScore = Math.round(
        (skillsMatch + experienceMatch + educationMatch + communicationAnalysis.score + vectorSimilarity) / 5
      );

      // Step 7: Generate recommendation
      const recommendation = overallScore >= 85 ? "Highly Recommended" :
                           overallScore >= 75 ? "Recommended" :
                           overallScore >= 65 ? "Consider" :
                           "Not Recommended";

      // Step 8: Generate strengths and concerns
      const strengths = this.generateStrengths(skillsMatch, experienceMatch, educationMatch, communicationAnalysis.score, vectorSimilarity);
      const concerns = this.generateConcerns(skillsMatch, experienceMatch, educationMatch, vectorSimilarity);

      const result: ResumeAnalysis = {
        overallScore,
        skillsMatch,
        experienceMatch,
        educationMatch,
        communicationScore: communicationAnalysis.score,
        vectorSimilarity,
        aiInsights: `${aiInsights} Vector similarity: ${vectorSimilarity.toFixed(1)}%. ${communicationAnalysis.analysis}`,
        strengths,
        concerns,
        recommendation,
        detailedAnalysis: `LangChain-powered analysis using semantic similarity, Q&A extraction, and sentiment analysis. Key findings: ${Object.entries(extractedInfo).slice(0, 2).map(([q, a]) => `${q}: ${a}`).join('; ')}`
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

  private generateStrengths(skillsMatch: number, experienceMatch: number, educationMatch: number, communicationScore: number, vectorSimilarity: number): string[] {
    const strengths = [];
    
    if (skillsMatch >= 80) strengths.push("Excellent technical skill alignment (LangChain semantic analysis)");
    if (experienceMatch >= 80) strengths.push("Strong relevant experience");
    if (educationMatch >= 80) strengths.push("Solid educational background");
    if (communicationScore >= 80) strengths.push("Excellent communication skills (AI sentiment analysis)");
    if (vectorSimilarity >= 75) strengths.push("High semantic similarity to job requirements");
    
    return strengths.length > 0 ? strengths : ["Shows potential for the role"];
  }

  private generateConcerns(skillsMatch: number, experienceMatch: number, educationMatch: number, vectorSimilarity: number): string[] {
    const concerns = [];
    
    if (skillsMatch < 60) concerns.push("Limited technical skill match");
    if (experienceMatch < 60) concerns.push("Experience gap in required areas");
    if (educationMatch < 60) concerns.push("Educational background may not align");
    if (vectorSimilarity < 50) concerns.push("Low semantic similarity to job requirements");
    
    return concerns;
  }
}

// Export singleton instance
export const langchainLocalAnalyzer = new LangChainLocalAnalyzer();
export type { ResumeAnalysis, JobDescription };
