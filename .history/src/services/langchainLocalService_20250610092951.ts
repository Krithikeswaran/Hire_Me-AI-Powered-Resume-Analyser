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

  // Parse required skills from input text
  private parseRequiredSkills(skillsText: string): string[] {
    if (!skillsText || skillsText.trim() === '') {
      return [];
    }

    // Split by common delimiters and clean up
    const skills = skillsText
      .split(/[,;|\n\r•·\-]+/)
      .map(s => s.trim())
      .filter(s => s.length > 1)
      .filter(s => !s.match(/^(and|or|with|using|including|such as|like|etc|years?|experience|knowledge|familiar|proficient|expert|beginner|intermediate|advanced)$/i))
      .map(s => s.replace(/[()[\]{}]/g, '').trim()) // Remove brackets
      .filter(s => s.length > 1);

    return [...new Set(skills)]; // Remove duplicates
  }

  // Prepare resume text for better searching
  private prepareResumeForSearch(resumeText: string): string {
    // Normalize whitespace and keep structure
    return resumeText
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s\.\-\+#]/g, ' ') // Keep only alphanumeric, spaces, dots, dashes, plus, hash
      .toLowerCase();
  }

  // Search for a specific skill in resume with multiple strategies
  private searchSkillInResume(skill: string, resumeForSearch: string, originalResume: string): {
    found: boolean;
    locations: string[];
    confidence: number;
  } {
    const skillLower = skill.toLowerCase().trim();
    const locations: string[] = [];
    let maxConfidence = 0;

    // Strategy 1: Exact match (highest confidence)
    if (this.findExactSkillMatch(skillLower, resumeForSearch)) {
      locations.push('Exact match');
      maxConfidence = Math.max(maxConfidence, 1.0);
    }

    // Strategy 2: Word boundary match
    const wordBoundaryRegex = new RegExp(`\\b${this.escapeRegex(skillLower)}\\b`, 'gi');
    if (wordBoundaryRegex.test(resumeForSearch)) {
      locations.push('Word boundary match');
      maxConfidence = Math.max(maxConfidence, 0.95);
    }

    // Strategy 3: Check common variations and synonyms
    const variations = this.getSkillVariations(skillLower);
    for (const variation of variations) {
      if (resumeForSearch.includes(variation)) {
        locations.push(`Variation: ${variation}`);
        maxConfidence = Math.max(maxConfidence, 0.85);
      }
    }

    // Strategy 4: Partial match for compound skills
    if (this.findPartialSkillMatch(skillLower, resumeForSearch)) {
      locations.push('Partial match');
      maxConfidence = Math.max(maxConfidence, 0.75);
    }

    return {
      found: locations.length > 0,
      locations,
      confidence: maxConfidence
    };
  }

  // Find exact skill match
  private findExactSkillMatch(skill: string, resumeText: string): boolean {
    return resumeText.includes(skill);
  }

  // Find partial skill match for compound skills
  private findPartialSkillMatch(skill: string, resumeText: string): boolean {
    // Handle compound skills like "react.js", "node.js", etc.
    const variations = [
      skill.replace(/\./g, ''),     // "react.js" -> "reactjs"
      skill.replace(/\./g, ' '),    // "react.js" -> "react js"
      skill.replace(/\s+/g, ''),    // "react native" -> "reactnative"
      skill.replace(/\s+/g, '.'),   // "react native" -> "react.native"
    ];

    return variations.some(variation => resumeText.includes(variation));
  }

  // Get skill variations and synonyms
  private getSkillVariations(skill: string): string[] {
    const variations = SKILL_SYNONYMS[skill] || [];

    // Add common programming variations
    const additionalVariations = [];

    if (skill.includes('javascript')) {
      additionalVariations.push('js', 'ecmascript', 'es6', 'es2015', 'es2020');
    }
    if (skill.includes('typescript')) {
      additionalVariations.push('ts');
    }
    if (skill.includes('python')) {
      additionalVariations.push('py', 'python3', 'python2');
    }
    if (skill.includes('java') && !skill.includes('javascript')) {
      additionalVariations.push('jdk', 'jre', 'openjdk');
    }
    if (skill.includes('react')) {
      additionalVariations.push('reactjs', 'react.js', 'react js');
    }
    if (skill.includes('node')) {
      additionalVariations.push('nodejs', 'node.js', 'node js');
    }
    if (skill.includes('angular')) {
      additionalVariations.push('angularjs', 'angular2', 'angular4', 'angular8');
    }
    if (skill.includes('vue')) {
      additionalVariations.push('vuejs', 'vue.js', 'vue js');
    }

    return [...variations, ...additionalVariations];
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

  // Search for skill patterns with different matching strategies and section awareness
  private searchSkillPattern(skill: string, resumeLower: string, originalText: string): { found: boolean; context: string; confidence: number } {
    // Identify different sections of the resume for weighted scoring
    const sections = this.identifyResumeSections(originalText);

    let bestMatch = { found: false, context: '', confidence: 0 };

    // Strategy 1: Section-aware exact word boundary match (highest confidence)
    const wordBoundaryRegex = new RegExp(`\\b${this.escapeRegex(skill)}\\b`, 'gi');
    const wordBoundaryMatches = [...originalText.matchAll(wordBoundaryRegex)];

    for (const match of wordBoundaryMatches) {
      const matchIndex = match.index || 0;
      const section = this.getResumeSection(matchIndex, sections);
      const sectionWeight = this.getSectionWeight(section);
      const confidence = 0.85 + (sectionWeight * 0.1); // Base 85% + section bonus

      if (confidence > bestMatch.confidence) {
        const context = this.extractContext(skill, originalText, matchIndex);
        bestMatch = { found: true, context: `${section}: ${context}`, confidence };
      }
    }

    if (bestMatch.found) return bestMatch;

    // Strategy 2: Section-aware exact phrase match (high confidence)
    const skillIndex = resumeLower.indexOf(skill);
    if (skillIndex !== -1) {
      const section = this.getResumeSection(skillIndex, sections);
      const sectionWeight = this.getSectionWeight(section);
      const confidence = 0.75 + (sectionWeight * 0.1);
      const context = this.extractContext(skill, originalText, skillIndex);
      return { found: true, context: `${section}: ${context}`, confidence };
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
      const patternIndex = resumeLower.indexOf(pattern);
      if (patternIndex !== -1) {
        const section = this.getResumeSection(patternIndex, sections);
        const sectionWeight = this.getSectionWeight(section);
        const confidence = 0.65 + (sectionWeight * 0.1);
        const context = this.extractContext(pattern, originalText, patternIndex);
        return { found: true, context: `${section}: ${context}`, confidence };
      }
    }

    // Strategy 4: Fuzzy match for common misspellings (lower confidence)
    const fuzzyMatch = this.fuzzySkillMatch(skill, resumeLower);
    if (fuzzyMatch.found) {
      return { found: true, context: fuzzyMatch.context, confidence: 0.5 };
    }

    return { found: false, context: '', confidence: 0 };
  }

  // Identify different sections of the resume
  private identifyResumeSections(text: string): { name: string; start: number; end: number }[] {
    const sections = [];
    const sectionHeaders = [
      { name: 'Skills', patterns: ['skills', 'technical skills', 'core competencies', 'technologies', 'expertise'] },
      { name: 'Experience', patterns: ['experience', 'work experience', 'employment', 'professional experience', 'career'] },
      { name: 'Projects', patterns: ['projects', 'personal projects', 'key projects', 'notable projects'] },
      { name: 'Education', patterns: ['education', 'academic', 'qualifications', 'degrees'] },
      { name: 'Certifications', patterns: ['certifications', 'certificates', 'credentials'] }
    ];

    let lastEnd = 0;
    for (const section of sectionHeaders) {
      for (const pattern of section.patterns) {
        const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
        const match = text.match(regex);
        if (match) {
          const index = text.toLowerCase().indexOf(pattern.toLowerCase(), lastEnd);
          if (index !== -1) {
            sections.push({
              name: section.name,
              start: index,
              end: index + 500 // Approximate section length
            });
            lastEnd = index + 500;
            break;
          }
        }
      }
    }

    return sections.sort((a, b) => a.start - b.start);
  }

  // Get the section where a skill was found
  private getResumeSection(index: number, sections: { name: string; start: number; end: number }[]): string {
    for (const section of sections) {
      if (index >= section.start && index <= section.end) {
        return section.name;
      }
    }
    return 'General';
  }

  // Get weight for different resume sections
  private getSectionWeight(section: string): number {
    const weights = {
      'Skills': 1.0,        // Highest weight - explicit skills section
      'Projects': 0.8,      // High weight - practical application
      'Experience': 0.7,    // Good weight - work experience
      'Certifications': 0.6, // Medium weight - formal recognition
      'Education': 0.4,     // Lower weight - academic background
      'General': 0.3        // Lowest weight - general mention
    };
    return weights[section] || 0.3;
  }

  // Extract context around found skill
  private extractContext(skill: string, text: string, skillIndex?: number): string {
    const index = skillIndex !== undefined ? skillIndex : text.toLowerCase().indexOf(skill.toLowerCase());
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

  // Simplified and highly accurate skills matching focused on exact skill detection
  async calculateJobSpecificSkillsMatch(resumeText: string, requiredSkills: string, jobTitle: string, jobDescription: string): Promise<{
    score: number;
    matchedSkills: string[];
    missingSkills: string[];
    technicalFit: number;
  }> {
    console.log('🎯 Starting accurate skills analysis...');
    console.log('Required skills input:', requiredSkills);

    // Clean and parse the required skills
    const skillsList = this.parseRequiredSkills(requiredSkills);
    console.log('Parsed skills to search for:', skillsList);

    // Prepare resume text for searching (normalize but keep original structure)
    const resumeForSearch = this.prepareResumeForSearch(resumeText);

    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];
    const skillDetails: { [key: string]: { found: boolean; locations: string[]; confidence: number } } = {};

    // Search for each required skill thoroughly
    skillsList.forEach(skill => {
      const searchResult = this.searchSkillInResume(skill, resumeForSearch, resumeText);

      if (searchResult.found) {
        matchedSkills.push(skill);
        skillDetails[skill] = {
          found: true,
          locations: searchResult.locations,
          confidence: searchResult.confidence
        };
        console.log(`✅ Found "${skill}" in: ${searchResult.locations.join(', ')}`);
      } else {
        missingSkills.push(skill);
        skillDetails[skill] = {
          found: false,
          locations: [],
          confidence: 0
        };
        console.log(`❌ Missing "${skill}"`);
      }
    });

    // Calculate simple and accurate scores
    const totalRequiredSkills = skillsList.length;
    const totalMatchedSkills = matchedSkills.length;

    // Basic skill match percentage
    const skillMatchPercentage = totalRequiredSkills > 0 ? (totalMatchedSkills / totalRequiredSkills) * 100 : 0;

    // Calculate confidence-weighted score
    const totalConfidence = matchedSkills.reduce((sum, skill) => {
      return sum + (skillDetails[skill]?.confidence || 0);
    }, 0);
    const averageConfidence = matchedSkills.length > 0 ? totalConfidence / matchedSkills.length : 0;

    // Final scores
    const skillsScore = Math.round(skillMatchPercentage);
    const confidenceBonus = Math.round(averageConfidence * 10); // Up to 10 point bonus
    const technicalFit = Math.min(95, skillsScore + confidenceBonus);

    // Sort matched skills by confidence
    const sortedMatchedSkills = matchedSkills.sort((a, b) => {
      const confA = skillDetails[a]?.confidence || 0;
      const confB = skillDetails[b]?.confidence || 0;
      return confB - confA;
    });

    // Enhanced logging
    console.log(`=== SKILLS ANALYSIS RESULTS ===`);
    console.log(`Total required skills: ${totalRequiredSkills}`);
    console.log(`Skills found: ${totalMatchedSkills}`);
    console.log(`Match percentage: ${skillMatchPercentage.toFixed(1)}%`);
    console.log(`Average confidence: ${(averageConfidence * 100).toFixed(1)}%`);
    console.log(`Skills score: ${skillsScore}%`);
    console.log(`Technical fit: ${technicalFit}%`);
    console.log(`Matched skills:`, sortedMatchedSkills);
    console.log(`Missing skills:`, missingSkills);
    console.log(`================================`);

    return {
      score: skillsScore,
      matchedSkills: sortedMatchedSkills,
      missingSkills: missingSkills,
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
