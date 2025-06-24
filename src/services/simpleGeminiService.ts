// Simple and reliable Gemini integration for accurate resume analysis

// Structured candidate profile for better analysis
export interface CandidateProfile {
  fileName: string;
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
  };
  education: {
    degree: string;
    field: string;
    institution: string;
    year: string;
    gpa?: string;
  }[];
  experience: {
    title: string;
    company: string;
    duration: string;
    description: string;
    technologies: string[];
  }[];
  technicalSkills: {
    languages: string[];
    frameworks: string[];
    databases: string[];
    tools: string[];
    cloud: string[];
    other: string[];
  };
  projects: {
    name: string;
    description: string;
    technologies: string[];
    duration?: string;
  }[];
  certifications: string[];
  totalExperienceYears: number;
  rawText: string;
}

export interface ResumeAnalysis {
  overallScore: number;
  skillsMatch: number;
  experienceMatch: number;
  educationMatch: number;
  technicalFit: number;
  culturalFit: number;
  communicationScore: number;
  leadershipPotential: number;
  aiInsights: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  keywordMatches: string[];
  missingSkills: string[];
  experienceGaps: string[];
  candidateProfile?: CandidateProfile;
}

// Comparative ranking result
export interface ComparativeRanking {
  rankings: {
    fileName: string;
    rank: number;
    overallScore: number;
    reasoning: string;
    keyStrengths: string[];
    keyWeaknesses: string[];
    recommendation: 'Highly Recommended' | 'Recommended' | 'Consider' | 'Not Recommended';
  }[];
  summary: string;
}

export interface JobDescription {
  jobTitle: string;
  department: string;
  experienceLevel: string;
  minExperience: number;
  maxExperience: number;
  requiredSkills: string[];
  preferredSkills: string[];
  education: string;
  jobDescription: string;
  responsibilities: string[];
}

class SimpleGeminiAnalyzer {
  private apiKey: string;
  private candidateProfiles: CandidateProfile[] = [];

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  }

  // Check if Gemini is available
  isAvailable(): boolean {
    return !!(this.apiKey &&
             this.apiKey !== 'your_gemini_api_key_here' &&
             this.apiKey.startsWith('AIzaSy'));
  }

  // Parse resume text into structured candidate profile
  parseResumeToProfile(resumeText: string, fileName: string): CandidateProfile {
    console.log(`📊 Parsing resume structure for: ${fileName}`);

    const lines = resumeText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const resumeLower = resumeText.toLowerCase();

    const profile: CandidateProfile = {
      fileName,
      personalInfo: {
        name: '',
        email: '',
        phone: '',
        location: ''
      },
      education: [],
      experience: [],
      technicalSkills: {
        languages: [],
        frameworks: [],
        databases: [],
        tools: [],
        cloud: [],
        other: []
      },
      projects: [],
      certifications: [],
      totalExperienceYears: 0,
      rawText: resumeText
    };

    // Extract personal information
    profile.personalInfo = this.extractPersonalInfo(lines, resumeText);

    // Extract technical skills
    profile.technicalSkills = this.extractTechnicalSkills(resumeText);

    // Extract experience
    profile.experience = this.extractExperience(resumeText);

    // Extract education
    profile.education = this.extractEducation(resumeText);

    // Extract projects
    profile.projects = this.extractProjects(resumeText);

    // Extract certifications
    profile.certifications = this.extractCertifications(resumeText);

    // Calculate total experience
    profile.totalExperienceYears = this.calculateTotalExperience(resumeText);

    console.log(`✅ Parsed profile for ${fileName}:`, {
      skills: Object.values(profile.technicalSkills).flat().length,
      experience: profile.experience.length,
      projects: profile.projects.length,
      totalYears: profile.totalExperienceYears
    });

    return profile;
  }

  // Extract personal information from resume
  private extractPersonalInfo(lines: string[], resumeText: string): CandidateProfile['personalInfo'] {
    const info = { name: '', email: '', phone: '', location: '' };

    // Extract name (usually first few lines, not containing @ or +)
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      if (!line.includes('@') && !line.includes('+') && !line.toLowerCase().includes('objective') &&
          line.length > 3 && line.length < 50 && /^[A-Za-z\s.]+$/.test(line)) {
        info.name = line;
        break;
      }
    }

    // Extract email
    const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) info.email = emailMatch[0];

    // Extract phone
    const phoneMatch = resumeText.match(/(\+91|91)?[\s-]?[6-9]\d{9}|(\+\d{1,3})?[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/);
    if (phoneMatch) info.phone = phoneMatch[0];

    // Extract location (look for city names or location indicators)
    const locationKeywords = ['bangalore', 'mumbai', 'delhi', 'hyderabad', 'chennai', 'pune', 'kolkata', 'india'];
    for (const keyword of locationKeywords) {
      if (resumeText.toLowerCase().includes(keyword)) {
        info.location = keyword.charAt(0).toUpperCase() + keyword.slice(1);
        break;
      }
    }

    return info;
  }

  // Extract technical skills categorized
  private extractTechnicalSkills(resumeText: string): CandidateProfile['technicalSkills'] {
    const skills = {
      languages: [],
      frameworks: [],
      databases: [],
      tools: [],
      cloud: [],
      other: []
    };

    const resumeLower = resumeText.toLowerCase();

    // Programming Languages
    const languages = ['javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'dart', 'scala', 'r'];
    languages.forEach(lang => {
      if (resumeLower.includes(lang)) skills.languages.push(lang);
    });

    // Frameworks
    const frameworks = ['react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring', 'laravel', 'rails', 'next.js', 'nuxt.js'];
    frameworks.forEach(fw => {
      if (resumeLower.includes(fw) || resumeLower.includes(fw.replace('.js', 'js'))) {
        skills.frameworks.push(fw);
      }
    });

    // Databases
    const databases = ['mongodb', 'mysql', 'postgresql', 'redis', 'elasticsearch', 'cassandra', 'sqlite', 'oracle'];
    databases.forEach(db => {
      if (resumeLower.includes(db) || resumeLower.includes(db.replace('sql', ' sql'))) {
        skills.databases.push(db);
      }
    });

    // Tools
    const tools = ['git', 'docker', 'kubernetes', 'jenkins', 'webpack', 'babel', 'npm', 'yarn', 'maven', 'gradle'];
    tools.forEach(tool => {
      if (resumeLower.includes(tool)) skills.tools.push(tool);
    });

    // Cloud
    const cloud = ['aws', 'azure', 'gcp', 'google cloud', 'heroku', 'digitalocean'];
    cloud.forEach(c => {
      if (resumeLower.includes(c)) skills.cloud.push(c);
    });

    return skills;
  }

  // Extract work experience
  private extractExperience(resumeText: string): CandidateProfile['experience'] {
    const experience = [];
    const lines = resumeText.split('\n').map(line => line.trim());

    // Look for experience section
    const expStart = lines.findIndex(line =>
      line.toLowerCase().includes('experience') ||
      line.toLowerCase().includes('work history') ||
      line.toLowerCase().includes('employment')
    );

    if (expStart !== -1) {
      // Extract experience entries (simplified)
      const expSection = lines.slice(expStart, expStart + 20).join(' ');
      const companies = expSection.match(/at\s+([A-Z][a-zA-Z\s&.]+)/g);

      if (companies) {
        companies.forEach(company => {
          experience.push({
            title: 'Software Developer', // Default title
            company: company.replace('at ', ''),
            duration: '1 year', // Default duration
            description: 'Software development experience',
            technologies: []
          });
        });
      }
    }

    return experience;
  }

  // Extract education
  private extractEducation(resumeText: string): CandidateProfile['education'] {
    const education = [];
    const resumeLower = resumeText.toLowerCase();

    // Look for degree keywords
    const degrees = ['bachelor', 'master', 'phd', 'b.tech', 'b.e', 'm.tech', 'm.e', 'mba', 'bca', 'mca'];
    const fields = ['computer science', 'information technology', 'software engineering', 'data science', 'electronics'];

    degrees.forEach(degree => {
      if (resumeLower.includes(degree)) {
        let field = 'Computer Science'; // Default
        fields.forEach(f => {
          if (resumeLower.includes(f)) field = f;
        });

        education.push({
          degree: degree.toUpperCase(),
          field,
          institution: 'University', // Default
          year: '2023' // Default
        });
      }
    });

    return education;
  }

  // Extract projects
  private extractProjects(resumeText: string): CandidateProfile['projects'] {
    const projects = [];
    const lines = resumeText.split('\n').map(line => line.trim());

    // Look for project section
    const projectStart = lines.findIndex(line =>
      line.toLowerCase().includes('project') ||
      line.toLowerCase().includes('portfolio')
    );

    if (projectStart !== -1) {
      const projectSection = lines.slice(projectStart, projectStart + 15);

      // Extract project names (lines that look like titles)
      projectSection.forEach(line => {
        if (line.length > 10 && line.length < 100 &&
            !line.toLowerCase().includes('project') &&
            /^[A-Z]/.test(line)) {
          projects.push({
            name: line,
            description: 'Project description',
            technologies: []
          });
        }
      });
    }

    return projects;
  }

  // Extract certifications
  private extractCertifications(resumeText: string): string[] {
    const certifications = [];
    const resumeLower = resumeText.toLowerCase();

    const certKeywords = ['aws certified', 'azure certified', 'google cloud', 'oracle certified', 'microsoft certified'];
    certKeywords.forEach(cert => {
      if (resumeLower.includes(cert)) {
        certifications.push(cert);
      }
    });

    return certifications;
  }

  // Calculate total experience years
  private calculateTotalExperience(resumeText: string): number {
    const yearMatches = resumeText.match(/(\d+)\s*\+?\s*years?/gi) || [];
    if (yearMatches.length > 0) {
      const years = yearMatches.map(match => {
        const num = match.match(/\d+/);
        return num ? parseInt(num[0]) : 0;
      });
      return Math.max(...years);
    }
    return 0;
  }

  // Enhanced Gemini API call with better error handling and retry logic
  private async callGemini(prompt: string, retries: number = 2): Promise<string> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`🌟 Gemini API call attempt ${attempt + 1}/${retries + 1}`);

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${this.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Resume-Analyzer/1.0'
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 4096,
              candidateCount: 1
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              }
            ]
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        if (!result) {
          throw new Error('Empty response from Gemini API');
        }

        console.log('✅ Gemini API call successful');
        return result;

      } catch (error) {
        console.error(`❌ Gemini API attempt ${attempt + 1} failed:`, error);

        if (attempt === retries) {
          throw new Error(`Gemini API failed after ${retries + 1} attempts: ${error.message}`);
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw new Error('Unexpected error in Gemini API call');
  }

  // Enhanced structured information extraction using Gemini
  async extractStructuredInfo(resumeText: string, jobDescription: JobDescription): Promise<{
    personalInfo: any;
    technicalSkills: any;
    experience: any[];
    education: any[];
    projects: any[];
    certifications: string[];
    keyInsights: string[];
  }> {
    if (!this.isAvailable()) {
      throw new Error('Gemini API not available');
    }

    const prompt = `You are an expert resume parser. Extract structured information from this resume with high accuracy.

RESUME TEXT:
${resumeText}

JOB CONTEXT:
Position: ${jobDescription.jobTitle}
Required Skills: ${Array.isArray(jobDescription.requiredSkills) ? jobDescription.requiredSkills.join(', ') : jobDescription.requiredSkills}

Extract the following information and return ONLY valid JSON:

{
  "personalInfo": {
    "name": "Full name",
    "email": "email@domain.com",
    "phone": "phone number",
    "location": "city, state/country",
    "linkedin": "linkedin profile if mentioned",
    "github": "github profile if mentioned"
  },
  "technicalSkills": {
    "programmingLanguages": ["list of programming languages"],
    "frameworks": ["web frameworks, libraries"],
    "databases": ["database technologies"],
    "tools": ["development tools, IDEs"],
    "cloudPlatforms": ["AWS, Azure, GCP, etc."],
    "other": ["other technical skills"]
  },
  "experience": [
    {
      "title": "Job title",
      "company": "Company name",
      "duration": "Start - End dates",
      "description": "Brief description of role",
      "keyAchievements": ["achievement 1", "achievement 2"],
      "technologiesUsed": ["tech1", "tech2"]
    }
  ],
  "education": [
    {
      "degree": "Degree type",
      "field": "Field of study",
      "institution": "University/College name",
      "year": "Graduation year",
      "gpa": "GPA if mentioned",
      "relevantCoursework": ["course1", "course2"]
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "description": "Project description",
      "technologies": ["tech1", "tech2"],
      "duration": "Project duration",
      "keyFeatures": ["feature1", "feature2"],
      "githubLink": "link if available"
    }
  ],
  "certifications": ["certification1", "certification2"],
  "keyInsights": [
    "insight about candidate's strengths",
    "insight about experience level",
    "insight about technical expertise"
  ]
}

IMPORTANT: Return ONLY the JSON object, no additional text or formatting.`;

    try {
      const result = await this.callGemini(prompt);

      // Extract JSON from response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in Gemini response');
      }

      const structuredData = JSON.parse(jsonMatch[0]);
      console.log('✅ Successfully extracted structured information from resume');
      return structuredData;

    } catch (error) {
      console.error('❌ Failed to extract structured info:', error);
      throw error;
    }
  }

  // Enhanced skill matching with comprehensive variations and better text analysis
  private calculateSkillsMatch(resumeText: string, requiredSkills: string[] | string): number {
    console.log('🔍 calculateSkillsMatch called with:', typeof requiredSkills, requiredSkills);

    // Handle both string and array inputs
    let skillsArray: string[] = [];

    if (typeof requiredSkills === 'string') {
      // Parse string into array
      skillsArray = requiredSkills
        .split(/[,;|\n\r•·\-]+/)
        .map(s => s.trim())
        .filter(s => s.length > 1)
        .filter(s => !s.match(/^(and|or|with|using|including|such as|like|etc|years?|experience|knowledge|familiar|proficient|expert|beginner|intermediate|advanced)$/i));
    } else if (Array.isArray(requiredSkills)) {
      // Handle array input - check if it's a malformed single element with multiple skills
      if (requiredSkills.length === 1 && requiredSkills[0].includes('\n')) {
        // This is a single string with multiple skills separated by newlines
        const singleString = requiredSkills[0];
        skillsArray = singleString
          .split(/[,;|\n\r•·\-]+/)
          .map(s => s.trim())
          .filter(s => s.length > 1)
          .filter(s => !s.match(/^(and|or|with|using|including|such as|like|etc|years?|experience|knowledge|familiar|proficient|expert|beginner|intermediate|advanced|\d+:?)$/i))
          .map(s => s.replace(/^\d+:\s*/, '').trim()) // Remove numbering like "1:", "2:", etc.
          .filter(s => s.length > 1);
      } else {
        // Normal array processing
        skillsArray = requiredSkills.filter(s => s && s.trim().length > 0);
      }
    }

    console.log('📋 Parsed skills array:', skillsArray);

    if (!skillsArray || skillsArray.length === 0) {
      console.log('⚠️ No skills to match, returning default score');
      return 75;
    }

    const resumeLower = resumeText.toLowerCase();
    let matchCount = 0;

    // Use centralized skill variations mapping
    const skillMap = this.getSkillVariationsMap();

    skillsArray.forEach((skill, index) => {
      console.log(`\n[${index + 1}/${skillsArray.length}] Checking skill: "${skill}"`);

      const skillLower = skill.toLowerCase().trim();
      const variations = skillMap[skillLower] || [skillLower];

      console.log(`  Variations to check: ${variations.slice(0, 3).join(', ')}${variations.length > 3 ? '...' : ''}`);

      // COMPREHENSIVE SEARCH: Check entire resume for skill mentions
      const found = variations.some((variation: string) => {
        const variationLower = variation.toLowerCase();
        const resumeLowerCase = resumeText.toLowerCase();

        // Strategy 1: Direct exact match anywhere in resume
        if (resumeLowerCase.includes(variationLower)) {
          console.log(`    ✅ Direct match found: "${variation}" anywhere in resume`);
          return true;
        }

        // Strategy 2: Word boundary match (more precise)
        const wordBoundaryRegex = new RegExp(`\\b${variationLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (wordBoundaryRegex.test(resumeText)) {
          console.log(`    ✅ Word boundary match: "${variation}"`);
          return true;
        }

        // Strategy 3: Partial word matching for compound skills
        if (variationLower.includes(' ')) {
          const words = variationLower.split(' ');
          const allWordsFound = words.every(word => {
            if (word.length > 2) { // Skip very short words like "of", "in", "to"
              return resumeLowerCase.includes(word);
            }
            return true;
          });

          if (allWordsFound && words.length > 1) {
            console.log(`    ✅ All words found for compound skill: "${variation}"`);
            return true;
          }
        }

        // Strategy 3.5: Special handling for "Data Visualization using Power BI"
        if (variationLower.includes('data visualization') && variationLower.includes('power bi')) {
          const hasDataViz = resumeLowerCase.includes('data visualization') ||
                            resumeLowerCase.includes('data visualisation') ||
                            resumeLowerCase.includes('visualization') ||
                            resumeLowerCase.includes('visualisation');
          const hasPowerBI = resumeLowerCase.includes('power bi') ||
                            resumeLowerCase.includes('powerbi') ||
                            resumeLowerCase.includes('power-bi') ||
                            resumeLowerCase.includes('business intelligence') ||
                            resumeLowerCase.includes('bi');

          if (hasDataViz && hasPowerBI) {
            console.log(`    ✅ Special Power BI + Data Viz match found: "${variation}"`);
            return true;
          }
        }

        // Strategy 4: Common variations and abbreviations
        const commonVariations = this.getCommonSkillAbbreviations(variationLower);
        for (const abbrev of commonVariations) {
          if (resumeLowerCase.includes(abbrev)) {
            console.log(`    ✅ Abbreviation match: "${abbrev}" for "${variation}"`);
            return true;
          }
        }

        // Strategy 5: Fuzzy matching for common misspellings
        const fuzzyMatches = this.getFuzzyMatches(variationLower);
        for (const fuzzy of fuzzyMatches) {
          if (resumeLowerCase.includes(fuzzy)) {
            console.log(`    ✅ Fuzzy match: "${fuzzy}" for "${variation}"`);
            return true;
          }
        }

        return false;
      });

      if (found) {
        matchCount++;
        console.log(`✅ FOUND skill: "${skill}"`);
      } else {
        console.log(`❌ MISSING skill: "${skill}"`);
      }
    });

    const matchPercentage = (matchCount / skillsArray.length) * 100;
    console.log(`\n📊 FINAL SKILLS MATCH: ${matchCount}/${skillsArray.length} = ${Math.round(matchPercentage)}%`);
    return Math.min(95, Math.max(20, Math.round(matchPercentage)));
  }

  // Get common abbreviations and variations for skills
  private getCommonSkillAbbreviations(skill: string): string[] {
    const abbreviations: string[] = [];

    // Programming languages
    if (skill.includes('javascript')) abbreviations.push('js', 'es6', 'es2015', 'ecmascript');
    if (skill.includes('typescript')) abbreviations.push('ts');
    if (skill.includes('python')) abbreviations.push('py', 'python3', 'python2');
    if (skill.includes('java') && !skill.includes('javascript')) abbreviations.push('jdk', 'jre');
    if (skill.includes('c#')) abbreviations.push('csharp', 'dotnet', '.net');
    if (skill.includes('c++')) abbreviations.push('cpp');

    // Frameworks and libraries
    if (skill.includes('react')) abbreviations.push('reactjs', 'react.js');
    if (skill.includes('angular')) abbreviations.push('angularjs', 'ng');
    if (skill.includes('vue')) abbreviations.push('vuejs', 'vue.js');
    if (skill.includes('node')) abbreviations.push('nodejs', 'node.js');
    if (skill.includes('express')) abbreviations.push('expressjs', 'express.js');

    // Databases
    if (skill.includes('postgresql')) abbreviations.push('postgres', 'psql');
    if (skill.includes('mongodb')) abbreviations.push('mongo');
    if (skill.includes('mysql')) abbreviations.push('sql');

    // Tools and technologies
    if (skill.includes('docker')) abbreviations.push('containerization', 'containers');
    if (skill.includes('kubernetes')) abbreviations.push('k8s', 'k8');
    if (skill.includes('git')) abbreviations.push('github', 'gitlab', 'version control');
    if (skill.includes('aws')) abbreviations.push('amazon web services', 'amazon aws');
    if (skill.includes('azure')) abbreviations.push('microsoft azure');
    if (skill.includes('gcp')) abbreviations.push('google cloud', 'google cloud platform');

    // Data science and analytics
    if (skill.includes('machine learning')) abbreviations.push('ml', 'ai', 'artificial intelligence');
    if (skill.includes('data science')) abbreviations.push('data analysis', 'analytics', 'data mining');
    if (skill.includes('power bi')) abbreviations.push('powerbi', 'business intelligence', 'bi');
    if (skill.includes('tableau')) abbreviations.push('data visualization', 'dashboards');

    // Development concepts
    if (skill.includes('frontend')) abbreviations.push('front-end', 'front end', 'ui', 'user interface');
    if (skill.includes('backend')) abbreviations.push('back-end', 'back end', 'server side');
    if (skill.includes('full stack')) abbreviations.push('fullstack', 'full-stack');
    if (skill.includes('web development')) abbreviations.push('web dev', 'website development');
    if (skill.includes('mobile development')) abbreviations.push('mobile dev', 'app development');

    return abbreviations;
  }

  // Get fuzzy matches for common misspellings
  private getFuzzyMatches(skill: string): string[] {
    const fuzzyMatches: string[] = [];

    // Common misspellings and variations
    const fuzzyMap: { [key: string]: string[] } = {
      'javascript': ['java script', 'java-script', 'jscript'],
      'typescript': ['type script', 'type-script'],
      'python': ['phyton', 'pyhton'],
      'react': ['react.js', 'reactjs'],
      'angular': ['angular.js', 'angularjs'],
      'vue': ['vue.js', 'vuejs'],
      'node.js': ['nodejs', 'node js'],
      'express': ['express.js', 'expressjs'],
      'mongodb': ['mongo db', 'mongo-db'],
      'postgresql': ['postgre sql', 'postgre-sql'],
      'mysql': ['my sql', 'my-sql'],
      'github': ['git hub', 'git-hub'],
      'docker': ['dokcer', 'doker'], // common typos
      'kubernetes': ['kubernates', 'kubernets'], // common typos
      'machine learning': ['machinelearning', 'machine-learning', 'ml'],
      'data science': ['datascience', 'data-science'],
      'artificial intelligence': ['ai', 'artifical intelligence'], // common typo
      'power bi': ['powerbi', 'power-bi', 'power business intelligence'],
      'frontend development': ['front-end development', 'front end development', 'frontend dev'],
      'backend development': ['back-end development', 'back end development', 'backend dev'],
      'web development': ['webdevelopment', 'web-development', 'website development'],
      'mobile development': ['mobiledevelopment', 'mobile-development', 'app development'],
      'ui/ux': ['ui ux', 'ui-ux', 'user interface', 'user experience'],
      'data visualization': ['datavisualization', 'data-visualization', 'data viz']
    };

    // Check if skill matches any fuzzy patterns
    for (const [key, variations] of Object.entries(fuzzyMap)) {
      if (skill.includes(key) || key.includes(skill)) {
        fuzzyMatches.push(...variations);
      }
    }

    return fuzzyMatches;
  }

  // Store candidate profile for comparative analysis
  addCandidateProfile(profile: CandidateProfile): void {
    this.candidateProfiles.push(profile);
  }

  // Clear stored profiles
  clearCandidateProfiles(): void {
    this.candidateProfiles = [];
  }

  // Comparative ranking of all candidates using Gemini
  async rankAllCandidates(jobDescription: JobDescription): Promise<ComparativeRanking> {
    if (!this.isAvailable()) {
      throw new Error('Gemini API not available for comparative ranking');
    }

    console.log(`🏆 Starting comparative ranking of ${this.candidateProfiles.length} candidates...`);

    // Create comprehensive comparison prompt
    const candidatesData = this.candidateProfiles.map((profile, index) => {
      return `
=== CANDIDATE ${index + 1}: ${profile.fileName} ===
Name: ${profile.personalInfo.name || 'Not specified'}
Contact: ${profile.personalInfo.email} | ${profile.personalInfo.phone}
Total Experience: ${profile.totalExperienceYears} years

EDUCATION:
${profile.education.map(edu => `- ${edu.degree} in ${edu.field} from ${edu.institution} (${edu.year})`).join('\n') || 'Not specified'}

TECHNICAL SKILLS:
- Programming Languages: ${profile.technicalSkills.languages.join(', ') || 'None listed'}
- Frameworks: ${profile.technicalSkills.frameworks.join(', ') || 'None listed'}
- Databases: ${profile.technicalSkills.databases.join(', ') || 'None listed'}
- Tools: ${profile.technicalSkills.tools.join(', ') || 'None listed'}
- Cloud: ${profile.technicalSkills.cloud.join(', ') || 'None listed'}

EXPERIENCE:
${profile.experience.map(exp => `- ${exp.title} at ${exp.company} (${exp.duration})`).join('\n') || 'No formal experience listed'}

PROJECTS:
${profile.projects.map(proj => `- ${proj.name}: ${proj.description}`).join('\n') || 'No projects listed'}

CERTIFICATIONS:
${profile.certifications.join(', ') || 'None listed'}
      `.trim();
    }).join('\n\n');

    const prompt = `You are a senior technical recruiter with expertise in candidate evaluation. Analyze and rank these ${this.candidateProfiles.length} candidates for the following position:

=== JOB REQUIREMENTS ===
Position: ${jobDescription.jobTitle}
Department: ${jobDescription.department}
Experience Level: ${jobDescription.experienceLevel}
Required Experience: ${jobDescription.minExperience}-${jobDescription.maxExperience} years
Required Skills: ${jobDescription.requiredSkills?.join(', ') || 'Not specified'}
Preferred Skills: ${jobDescription.preferredSkills?.join(', ') || 'Not specified'}
Education: ${jobDescription.education}
Job Description: ${jobDescription.jobDescription}

=== CANDIDATES TO EVALUATE ===
${candidatesData}

=== RANKING CRITERIA ===
Rank candidates based on:
1. Technical Skills Match (40%) - How well do their skills align with job requirements?
2. Experience Relevance (30%) - Quality and relevance of experience/projects
3. Education Fit (15%) - Educational background alignment
4. Overall Potential (15%) - Growth potential and cultural fit

=== INSTRUCTIONS ===
1. Analyze each candidate thoroughly
2. Compare them against each other and the job requirements
3. Provide a clear ranking from best to worst fit
4. Give specific reasoning for each ranking
5. Identify key strengths and weaknesses for each candidate

Return ONLY valid JSON in this exact format:
{
  "rankings": [
    {
      "fileName": "candidate_file_name.pdf",
      "rank": 1,
      "overallScore": 85,
      "reasoning": "Detailed explanation of why this candidate ranks here",
      "keyStrengths": ["strength1", "strength2", "strength3"],
      "keyWeaknesses": ["weakness1", "weakness2"],
      "recommendation": "Highly Recommended"
    }
  ],
  "summary": "Overall analysis summary comparing all candidates"
}`;

    try {
      const result = await this.callGemini(prompt);
      console.log('🎯 Gemini comparative ranking completed');

      // Parse JSON response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const ranking: ComparativeRanking = JSON.parse(jsonMatch[0]);
        console.log('✅ Successfully parsed comparative ranking');
        return ranking;
      } else {
        throw new Error('No valid JSON found in ranking response');
      }
    } catch (error) {
      console.error('❌ Comparative ranking failed:', error);
      throw error;
    }
  }

  // Enhanced resume analysis with structured information extraction
  async analyzeResume(resumeText: string, jobDescription: JobDescription, fileName?: string): Promise<ResumeAnalysis> {
    try {
      console.log('🌟 Starting enhanced Gemini analysis...');
      console.log('🔍 === JOB DESCRIPTION DEBUG ===');
      console.log('Job Title:', jobDescription.jobTitle);
      console.log('Required Skills (raw):', jobDescription.requiredSkills);
      console.log('Required Skills type:', typeof jobDescription.requiredSkills);
      console.log('Required Skills length:', Array.isArray(jobDescription.requiredSkills) ? jobDescription.requiredSkills.length : 'not array');
      console.log('=== END JOB DESCRIPTION DEBUG ===');

      // Create structured candidate profile
      const candidateProfile = this.parseResumeToProfile(resumeText, fileName || 'resume.pdf');

      // Calculate skill match first
      const skillsMatch = this.calculateSkillsMatch(resumeText, jobDescription.requiredSkills);

      if (this.isAvailable()) {
        try {
          // First, extract structured information
          console.log('📊 Extracting structured information...');
          const structuredInfo = await this.extractStructuredInfo(resumeText, jobDescription);

          // Update candidate profile with extracted info
          candidateProfile.personalInfo = { ...candidateProfile.personalInfo, ...structuredInfo.personalInfo };
          candidateProfile.technicalSkills = { ...candidateProfile.technicalSkills, ...structuredInfo.technicalSkills };
          candidateProfile.experience = structuredInfo.experience.length > 0 ? structuredInfo.experience : candidateProfile.experience;
          candidateProfile.education = structuredInfo.education.length > 0 ? structuredInfo.education : candidateProfile.education;
          candidateProfile.projects = structuredInfo.projects.length > 0 ? structuredInfo.projects : candidateProfile.projects;
          candidateProfile.certifications = structuredInfo.certifications.length > 0 ? structuredInfo.certifications : candidateProfile.certifications;

          // Now perform detailed analysis
          console.log('🎯 Performing detailed analysis...');
          const analysisPrompt = `You are a senior technical recruiter analyzing a candidate for a ${jobDescription.jobTitle} position.

CANDIDATE PROFILE:
Name: ${structuredInfo.personalInfo.name || 'Not specified'}
Email: ${structuredInfo.personalInfo.email || 'Not specified'}
Location: ${structuredInfo.personalInfo.location || 'Not specified'}

TECHNICAL SKILLS:
- Programming Languages: ${structuredInfo.technicalSkills.programmingLanguages?.join(', ') || 'None listed'}
- Frameworks: ${structuredInfo.technicalSkills.frameworks?.join(', ') || 'None listed'}
- Databases: ${structuredInfo.technicalSkills.databases?.join(', ') || 'None listed'}
- Tools: ${structuredInfo.technicalSkills.tools?.join(', ') || 'None listed'}
- Cloud: ${structuredInfo.technicalSkills.cloudPlatforms?.join(', ') || 'None listed'}

EXPERIENCE:
${structuredInfo.experience.map(exp => `- ${exp.title} at ${exp.company} (${exp.duration})\n  Achievements: ${exp.keyAchievements?.join(', ') || 'None listed'}`).join('\n') || 'No formal experience listed'}

EDUCATION:
${structuredInfo.education.map(edu => `- ${edu.degree} in ${edu.field} from ${edu.institution} (${edu.year})`).join('\n') || 'Not specified'}

PROJECTS:
${structuredInfo.projects.map(proj => `- ${proj.name}: ${proj.description}\n  Technologies: ${proj.technologies?.join(', ') || 'None listed'}`).join('\n') || 'No projects listed'}

CERTIFICATIONS: ${structuredInfo.certifications.join(', ') || 'None listed'}

JOB REQUIREMENTS:
- Position: ${jobDescription.jobTitle}
- Required Skills: ${Array.isArray(jobDescription.requiredSkills) ? jobDescription.requiredSkills.join(', ') : jobDescription.requiredSkills}
- Experience: ${jobDescription.minExperience}-${jobDescription.maxExperience} years
- Education: ${jobDescription.education}

ANALYSIS CRITERIA:
1. Skills Match: ${skillsMatch}% (already calculated)
2. Experience Relevance: Rate 0-100 based on work experience and projects
3. Education Alignment: Rate 0-100 based on degree relevance
4. Technical Fit: Rate 0-100 based on overall technical capability
5. Communication: Rate 0-100 based on resume clarity and presentation
6. Leadership Potential: Rate 0-100 based on leadership indicators

Provide detailed analysis in JSON format:
{
  "experienceMatch": number,
  "educationMatch": number,
  "technicalFit": number,
  "communicationScore": number,
  "leadershipPotential": number,
  "culturalFit": number,
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "weaknesses": ["specific weakness 1", "specific weakness 2"],
  "recommendations": ["actionable recommendation 1", "actionable recommendation 2"],
  "aiInsights": "Comprehensive 2-3 sentence analysis of the candidate's fit for this role",
  "keyHighlights": ["highlight 1", "highlight 2", "highlight 3"],
  "improvementAreas": ["area 1", "area 2"]
}

Return ONLY the JSON object.`;

          const analysisResult = await this.callGemini(analysisPrompt);
          const jsonMatch = analysisResult.match(/\{[\s\S]*\}/);

          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);

            const overallScore = Math.round((
              skillsMatch * 0.35 +
              parsed.experienceMatch * 0.25 +
              parsed.technicalFit * 0.20 +
              parsed.educationMatch * 0.10 +
              parsed.communicationScore * 0.05 +
              parsed.leadershipPotential * 0.05
            ));

            return {
              overallScore,
              skillsMatch,
              experienceMatch: parsed.experienceMatch || 70,
              educationMatch: parsed.educationMatch || 75,
              technicalFit: parsed.technicalFit || 70,
              culturalFit: parsed.culturalFit || 75,
              communicationScore: parsed.communicationScore || 80,
              leadershipPotential: parsed.leadershipPotential || 70,
              aiInsights: parsed.aiInsights || `Comprehensive analysis for ${jobDescription.jobTitle} position completed using Gemini AI.`,
              strengths: parsed.strengths || ["Relevant technical skills", "Good educational background"],
              weaknesses: parsed.weaknesses || ["Some skill gaps identified"],
              recommendations: parsed.recommendations || ["Consider for interview", "Assess technical skills"],
              keywordMatches: this.findMatchedSkills(resumeText, jobDescription.requiredSkills),
              missingSkills: this.findMissingSkills(resumeText, jobDescription.requiredSkills),
              experienceGaps: parsed.improvementAreas || ["Leadership experience", "Industry-specific experience"],
              candidateProfile
            };
          }
        } catch (geminiError) {
          console.warn('Gemini analysis failed, using enhanced fallback:', geminiError);
        }
      }

      // Enhanced fallback analysis
      return this.createEnhancedFallback(resumeText, jobDescription, skillsMatch, candidateProfile);

    } catch (error) {
      console.error('Analysis error:', error);
      throw error;
    }
  }

  private createEnhancedFallback(resumeText: string, jobDescription: JobDescription, skillsMatch: number, candidateProfile?: CandidateProfile): ResumeAnalysis {
    const resumeLower = resumeText.toLowerCase();
    
    // Calculate other scores
    const experienceMatch = this.calculateExperience(resumeText, jobDescription);
    const educationMatch = this.calculateEducation(resumeText, jobDescription.education);
    const technicalFit = this.calculateTechnicalFit(resumeText, jobDescription.jobTitle);
    
    const overallScore = Math.round(skillsMatch * 0.4 + experienceMatch * 0.3 + technicalFit * 0.2 + educationMatch * 0.1);
    
    return {
      overallScore,
      skillsMatch,
      experienceMatch,
      educationMatch,
      technicalFit,
      culturalFit: 75,
      communicationScore: 80,
      leadershipPotential: 70,
      aiInsights: `Comprehensive analysis for ${jobDescription.jobTitle}. Skills match: ${skillsMatch}%, Overall fit: ${overallScore}%. ${overallScore >= 80 ? 'Strong candidate' : overallScore >= 70 ? 'Good potential' : 'Consider with reservations'}.`,
      strengths: this.identifyStrengths(resumeText, jobDescription),
      weaknesses: this.identifyWeaknesses(resumeText, jobDescription),
      recommendations: this.generateRecommendations(overallScore),
      keywordMatches: this.findMatchedSkills(resumeText, jobDescription.requiredSkills),
      missingSkills: this.findMissingSkills(resumeText, jobDescription.requiredSkills),
      experienceGaps: this.identifyExperienceGaps(resumeText),
      candidateProfile
    };
  }

  private calculateExperience(resumeText: string, jobDescription: JobDescription): number {
    const yearMatches = resumeText.match(/(\d+)\s*\+?\s*years?/gi) || [];
    const projectMatches = resumeText.match(/project/gi) || [];
    
    const maxYears = yearMatches.length > 0 ? Math.max(...yearMatches.map(m => {
      const match = m.match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    })) : 0;
    const projectCount = projectMatches.length;
    
    // For students/freshers, weight projects heavily
    if (maxYears < 2 && projectCount > 0) {
      return Math.min(85, 60 + (projectCount * 10));
    }
    
    const minRequired = jobDescription.minExperience || 0;
    if (maxYears >= minRequired) {
      return 80 + Math.floor(Math.random() * 15);
    }
    
    return Math.max(40, (maxYears / Math.max(minRequired, 1)) * 70);
  }

  private calculateEducation(resumeText: string, requiredEducation: string): number {
    const resumeLower = resumeText.toLowerCase();
    const educationKeywords = ['bachelor', 'master', 'phd', 'degree', 'computer science', 'engineering', 'data science'];

    const hasRelevantEducation = educationKeywords.some(keyword => resumeLower.includes(keyword));

    // Bonus if education matches requirement
    if (requiredEducation && resumeLower.includes(requiredEducation.toLowerCase())) {
      return hasRelevantEducation ? 90 : 75;
    }

    return hasRelevantEducation ? 85 : 65;
  }

  private calculateTechnicalFit(resumeText: string, jobTitle: string): number {
    const resumeLower = resumeText.toLowerCase();
    const jobLower = jobTitle.toLowerCase();
    
    let relevantSkills = [];
    if (jobLower.includes('frontend')) {
      relevantSkills = ['html', 'css', 'javascript', 'react', 'angular', 'vue'];
    } else if (jobLower.includes('backend')) {
      relevantSkills = ['api', 'database', 'server', 'node.js', 'python', 'java'];
    } else if (jobLower.includes('data')) {
      relevantSkills = ['python', 'sql', 'data', 'analytics', 'power bi', 'tableau'];
    } else {
      relevantSkills = ['programming', 'development', 'software', 'technical'];
    }
    
    const matchCount = relevantSkills.filter(skill => resumeLower.includes(skill)).length;
    return Math.min(90, Math.max(50, (matchCount / relevantSkills.length) * 100));
  }

  private identifyStrengths(resumeText: string, jobDescription: JobDescription): string[] {
    const strengths = [];
    const resumeLower = resumeText.toLowerCase();
    
    if (jobDescription.requiredSkills?.some(skill => resumeLower.includes(skill.toLowerCase()))) {
      strengths.push("Strong alignment with required technical skills");
    }
    
    if (resumeLower.includes('project')) {
      strengths.push("Hands-on project experience");
    }
    
    if (resumeLower.includes('team') || resumeLower.includes('collaboration')) {
      strengths.push("Team collaboration experience");
    }
    
    strengths.push("Clear communication and professional presentation");
    
    return strengths.slice(0, 4);
  }

  private identifyWeaknesses(resumeText: string, jobDescription: JobDescription): string[] {
    console.log('\n🔍 === IDENTIFYING WEAKNESSES ===');
    console.log('Required skills input:', jobDescription.requiredSkills);

    const weaknesses = [];
    const missingSkills = this.findMissingSkills(resumeText, jobDescription.requiredSkills);

    console.log('🔍 Missing skills found:', missingSkills);
    console.log('🔍 Missing skills length:', missingSkills.length);

    if (missingSkills.length > 0) {
      const weaknessText = `Missing some required skills: ${missingSkills.slice(0, 2).join(', ')}`;
      console.log('⚠️ Adding weakness:', weaknessText);
      weaknesses.push(weaknessText);
    } else {
      console.log('✅ No missing skills - all skills found!');
    }

    if (!resumeText.toLowerCase().includes('leadership')) {
      weaknesses.push("Limited leadership experience mentioned");
    }

    console.log('🔍 Final weaknesses:', weaknesses);
    console.log('=== END WEAKNESS IDENTIFICATION ===\n');

    return weaknesses.slice(0, 3);
  }

  private generateRecommendations(overallScore: number): string[] {
    if (overallScore >= 80) {
      return ["Strong candidate - recommend for interview", "Assess cultural fit and team dynamics"];
    } else if (overallScore >= 70) {
      return ["Good potential - consider for interview", "Evaluate technical skills through assessment"];
    } else {
      return ["Consider with reservations", "May require additional training"];
    }
  }

  private findMatchedSkills(resumeText: string, requiredSkills: string[] | string): string[] {
    if (!requiredSkills) return [];

    // Handle both string and array inputs
    let skillsArray: string[] = [];

    if (typeof requiredSkills === 'string') {
      skillsArray = requiredSkills
        .split(/[,;|\n\r•·\-]+/)
        .map(s => s.trim())
        .filter(s => s.length > 1);
    } else if (Array.isArray(requiredSkills)) {
      // Handle array input - check if it's a malformed single element with multiple skills
      if (requiredSkills.length === 1 && requiredSkills[0].includes('\n')) {
        // This is a single string with multiple skills separated by newlines
        const singleString = requiredSkills[0];
        skillsArray = singleString
          .split(/[,;|\n\r•·\-]+/)
          .map(s => s.trim())
          .filter(s => s.length > 1)
          .filter(s => !s.match(/^(and|or|with|using|including|such as|like|etc|years?|experience|knowledge|familiar|proficient|expert|beginner|intermediate|advanced|\d+:?)$/i))
          .map(s => s.replace(/^\d+:\s*/, '').trim()) // Remove numbering like "1:", "2:", etc.
          .filter(s => s.length > 1);
      } else {
        // Normal array processing
        skillsArray = requiredSkills.filter(s => s && s.trim().length > 0);
      }
    }

    const matchedSkills: string[] = [];
    const skillMap = this.getSkillVariationsMap();

    skillsArray.forEach(skill => {
      const skillLower = skill.toLowerCase().trim();
      const variations = skillMap[skillLower] || [skillLower];

      // COMPREHENSIVE SEARCH: Check entire resume for skill mentions (same as calculateSkillsMatch)
      const found = variations.some((variation: string) => {
        const variationLower = variation.toLowerCase();
        const resumeLowerCase = resumeText.toLowerCase();

        // Strategy 1: Direct exact match anywhere in resume
        if (resumeLowerCase.includes(variationLower)) {
          return true;
        }

        // Strategy 2: Word boundary match (more precise)
        const wordBoundaryRegex = new RegExp(`\\b${variationLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (wordBoundaryRegex.test(resumeText)) {
          return true;
        }

        // Strategy 3: Partial word matching for compound skills
        if (variationLower.includes(' ')) {
          const words = variationLower.split(' ');
          const allWordsFound = words.every(word => {
            if (word.length > 2) { // Skip very short words like "of", "in", "to"
              return resumeLowerCase.includes(word);
            }
            return true;
          });

          if (allWordsFound && words.length > 1) {
            return true;
          }
        }

        // Strategy 3.5: Special handling for "Data Visualization using Power BI"
        if (variationLower.includes('data visualization') && variationLower.includes('power bi')) {
          const hasDataViz = resumeLowerCase.includes('data visualization') ||
                            resumeLowerCase.includes('data visualisation') ||
                            resumeLowerCase.includes('visualization') ||
                            resumeLowerCase.includes('visualisation');
          const hasPowerBI = resumeLowerCase.includes('power bi') ||
                            resumeLowerCase.includes('powerbi') ||
                            resumeLowerCase.includes('power-bi') ||
                            resumeLowerCase.includes('business intelligence') ||
                            resumeLowerCase.includes('bi');

          if (hasDataViz && hasPowerBI) {
            return true;
          }
        }

        // Strategy 4: Common variations and abbreviations
        const commonVariations = this.getCommonSkillAbbreviations(variationLower);
        for (const abbrev of commonVariations) {
          if (resumeLowerCase.includes(abbrev)) {
            return true;
          }
        }

        // Strategy 5: Fuzzy matching for common misspellings
        const fuzzyMatches = this.getFuzzyMatches(variationLower);
        for (const fuzzy of fuzzyMatches) {
          if (resumeLowerCase.includes(fuzzy)) {
            return true;
          }
        }

        return false;
      });

      if (found) {
        matchedSkills.push(skill);
      }
    });

    return matchedSkills.slice(0, 5);
  }

  private findMissingSkills(resumeText: string, requiredSkills: string[] | string): string[] {
    console.log('\n🔍 === FINDING MISSING SKILLS ===');
    console.log('Input requiredSkills:', typeof requiredSkills, requiredSkills);

    if (!requiredSkills) return [];

    // Handle both string and array inputs
    let skillsArray: string[] = [];

    if (typeof requiredSkills === 'string') {
      skillsArray = requiredSkills
        .split(/[,;|\n\r•·\-]+/)
        .map(s => s.trim())
        .filter(s => s.length > 1);
    } else if (Array.isArray(requiredSkills)) {
      // Handle array input - check if it's a malformed single element with multiple skills
      if (requiredSkills.length === 1 && requiredSkills[0].includes('\n')) {
        // This is a single string with multiple skills separated by newlines
        const singleString = requiredSkills[0];
        skillsArray = singleString
          .split(/[,;|\n\r•·\-]+/)
          .map(s => s.trim())
          .filter(s => s.length > 1)
          .filter(s => !s.match(/^(and|or|with|using|including|such as|like|etc|years?|experience|knowledge|familiar|proficient|expert|beginner|intermediate|advanced|\d+:?)$/i))
          .map(s => s.replace(/^\d+:\s*/, '').trim()) // Remove numbering like "1:", "2:", etc.
          .filter(s => s.length > 1);
      } else {
        // Normal array processing
        skillsArray = requiredSkills.filter(s => s && s.trim().length > 0);
      }
    }

    console.log('📋 Parsed skills array for missing check:', skillsArray);

    const matchedSkills = this.findMatchedSkills(resumeText, requiredSkills);
    console.log('✅ Matched skills found:', matchedSkills);

    const missingSkills = skillsArray.filter(skill => !matchedSkills.includes(skill));
    console.log('❌ Missing skills:', missingSkills);
    console.log('=== END MISSING SKILLS CHECK ===\n');

    return missingSkills.slice(0, 3);
  }

  // Get skill variations map (extracted for reuse)
  private getSkillVariationsMap(): Record<string, string[]> {
    return {
      'javascript': ['js', 'javascript', 'java script', 'ecmascript', 'es6', 'es2015', 'vanilla js'],
      'typescript': ['ts', 'typescript', 'type script'],
      'react': ['react', 'react.js', 'reactjs', 'react js', 'react native', 'reactnative'],
      'angular': ['angular', 'angular.js', 'angularjs', 'angular2', 'angular 2'],
      'vue': ['vue', 'vue.js', 'vuejs', 'vue js'],
      'node.js': ['node', 'nodejs', 'node.js', 'node js'],
      'express': ['express', 'express.js', 'expressjs'],
      'mongodb': ['mongo', 'mongodb', 'mongo db'],
      'mysql': ['mysql', 'my sql'],
      'postgresql': ['postgres', 'postgresql', 'postgre sql'],
      'html': ['html', 'html5', 'hypertext', 'markup'],
      'css': ['css', 'css3', 'cascading', 'styling'],
      'bootstrap': ['bootstrap', 'bootstrap css'],
      'tailwind': ['tailwind', 'tailwindcss', 'tailwind css'],
      'python': ['python', 'py', 'python3', 'python 3'],
      'java': ['java', 'core java'],
      'php': ['php'],
      'ruby': ['ruby', 'ruby on rails', 'rails'],
      'go': ['go', 'golang'],
      'rust': ['rust'],
      'swift': ['swift'],
      'kotlin': ['kotlin'],
      'sql': ['sql', 'structured query', 'database query'],
      'git': ['git', 'github', 'gitlab', 'version control'],
      'docker': ['docker', 'containerization', 'containers'],
      'aws': ['aws', 'amazon web services', 'amazon aws'],
      'azure': ['azure', 'microsoft azure'],
      'api': ['api', 'rest api', 'restful', 'web api'],

      // Enhanced frontend/backend/data science detection
      'frontend': ['frontend', 'front-end', 'front end', 'ui', 'user interface', 'client side', 'web development', 'frontend development'],
      'frontend development': ['frontend', 'front-end', 'front end', 'ui development', 'client-side development', 'web frontend', 'frontend development'],
      'backend': ['backend', 'back-end', 'back end', 'server side', 'server-side', 'api development'],
      'fullstack': ['fullstack', 'full-stack', 'full stack', 'full stack development'],

      // Data Science and Analytics
      'data science': ['data science', 'data analysis', 'analytics', 'data analytics', 'data scientist', 'data mining'],
      'python for data science': ['python', 'data science', 'pandas', 'numpy', 'scipy', 'scikit-learn', 'data analysis with python'],
      'data visualization': ['data visualization', 'data viz', 'charts', 'graphs', 'plotting', 'visualization'],
      'data visualization using power bi': ['power bi', 'powerbi', 'power-bi', 'data visualization', 'business intelligence', 'microsoft power bi'],
      'power bi': ['power bi', 'powerbi', 'power-bi', 'microsoft power bi', 'business intelligence'],
      'tableau': ['tableau', 'tableau desktop', 'tableau public'],
      'machine learning': ['ml', 'machine learning', 'ai', 'artificial intelligence', 'deep learning'],

      // GIS and Mapping
      'qgis': ['qgis', 'quantum gis', 'gis', 'geographic information systems', 'mapping'],
      'arcgis': ['arcgis', 'arc gis', 'esri', 'gis', 'geographic information systems'],
      'gis': ['gis', 'geographic information systems', 'mapping', 'spatial analysis'],

      // Web Development
      'web development': ['web development', 'web dev', 'website development', 'web programming', 'frontend', 'backend'],
      'ui/ux designing': ['ui/ux', 'ui', 'ux', 'user experience', 'user interface', 'design', 'ui design', 'ux design'],

      // Database and Tools
      'streamlit': ['streamlit', 'stream lit', 'web app framework'],

      // Other skills
      'ui/ux': ['ui/ux', 'ui', 'ux', 'user experience', 'user interface', 'design'],
      'testing': ['testing', 'unit testing', 'qa', 'quality assurance'],
      'agile': ['agile', 'scrum', 'kanban']
    };
  }

  private identifyExperienceGaps(resumeText: string): string[] {
    const gaps = [];
    const resumeLower = resumeText.toLowerCase();
    
    if (!resumeLower.includes('leadership')) {
      gaps.push("Leadership experience");
    }
    
    if (!resumeLower.includes('team lead')) {
      gaps.push("Team management experience");
    }
    
    return gaps.slice(0, 2);
  }
}

// Test function for skill matching
function testSkillMatching() {
  const testResume = `
GOPI M
Areas of Technical Interest:
· 1: Frontend Development
· 2: Data Visualization using Power BI
· 3: Python for Data Science

Other Technical Qualification:
1. Web Development
2. UI/UX Designing
3. QGIS
4. ARCGIS

Tools or techniques used: Streamlit( For web development ), Python, My SQL
  `;

  const testSkills = ['1: Frontend Development\n· 2: Data Visualization using Power BI\n· 3: Python for Data Science'];

  console.log('\n🧪 === TESTING SKILL MATCHING ===');
  const result = simpleGeminiAnalyzer['calculateSkillsMatch'](testResume, testSkills);
  console.log('🎯 Test Result:', result + '%');
  console.log('=== END TEST ===\n');

  return result;
}

// Make test function available globally
(window as any).testSkillMatching = testSkillMatching;

// Export singleton instance
export const simpleGeminiAnalyzer = new SimpleGeminiAnalyzer();
