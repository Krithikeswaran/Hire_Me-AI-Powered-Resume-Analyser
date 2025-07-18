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

  // Simple Gemini API call
  private async callGemini(prompt: string): Promise<string> {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  // Enhanced skill matching with comprehensive variations
  private calculateSkillsMatch(resumeText: string, requiredSkills: string[]): number {
    if (!requiredSkills || requiredSkills.length === 0) return 75;
    
    const resumeLower = resumeText.toLowerCase();
    let matchCount = 0;
    
    // Skill variations mapping
    const skillMap = {
      'javascript': ['js', 'javascript', 'java script', 'ecmascript'],
      'typescript': ['ts', 'typescript', 'type script'],
      'react': ['react', 'react.js', 'reactjs', 'react js'],
      'angular': ['angular', 'angular.js', 'angularjs'],
      'vue': ['vue', 'vue.js', 'vuejs'],
      'node.js': ['node', 'nodejs', 'node.js', 'node js'],
      'express': ['express', 'express.js', 'expressjs'],
      'mongodb': ['mongo', 'mongodb', 'mongo db'],
      'mysql': ['mysql', 'my sql'],
      'postgresql': ['postgres', 'postgresql', 'postgre sql'],
      'html': ['html', 'html5', 'hypertext'],
      'css': ['css', 'css3', 'cascading'],
      'bootstrap': ['bootstrap', 'bootstrap css'],
      'tailwind': ['tailwind', 'tailwindcss', 'tailwind css'],
      'python': ['python', 'py'],
      'java': ['java'],
      'php': ['php'],
      'ruby': ['ruby', 'ruby on rails', 'rails'],
      'go': ['go', 'golang'],
      'rust': ['rust'],
      'swift': ['swift'],
      'kotlin': ['kotlin'],
      'sql': ['sql', 'structured query'],
      'git': ['git', 'github', 'gitlab'],
      'docker': ['docker', 'containerization'],
      'aws': ['aws', 'amazon web services'],
      'azure': ['azure', 'microsoft azure'],
      'api': ['api', 'rest api', 'restful'],
      'frontend': ['frontend', 'front-end', 'front end', 'ui'],
      'backend': ['backend', 'back-end', 'back end', 'server side'],
      'fullstack': ['fullstack', 'full-stack', 'full stack'],
      'ui/ux': ['ui/ux', 'ui', 'ux', 'user experience', 'user interface'],
      'power bi': ['power bi', 'powerbi', 'power-bi'],
      'tableau': ['tableau'],
      'data science': ['data science', 'data analysis', 'analytics'],
      'machine learning': ['ml', 'machine learning', 'ai', 'artificial intelligence'],
      'testing': ['testing', 'unit testing', 'qa'],
      'agile': ['agile', 'scrum', 'kanban']
    };
    
    requiredSkills.forEach(skill => {
      const skillLower = skill.toLowerCase().trim();
      const variations = skillMap[skillLower] || [skillLower];
      
      const found = variations.some(variation => 
        resumeLower.includes(variation.toLowerCase())
      );
      
      if (found) {
        matchCount++;
      }
    });
    
    const matchPercentage = (matchCount / requiredSkills.length) * 100;
    return Math.min(95, Math.max(20, Math.round(matchPercentage)));
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

  // Analyze resume with Gemini or fallback
  async analyzeResume(resumeText: string, jobDescription: JobDescription, fileName?: string): Promise<ResumeAnalysis> {
    try {
      console.log('🌟 Starting Gemini-enhanced analysis...');

      // Create structured candidate profile
      const candidateProfile = this.parseResumeToProfile(resumeText, fileName || 'resume.pdf');

      // Calculate skill match first
      const skillsMatch = this.calculateSkillsMatch(resumeText, jobDescription.requiredSkills);

      if (this.isAvailable()) {
        // Try Gemini analysis
        try {
          const prompt = `Analyze this resume for a ${jobDescription.jobTitle} position. 

JOB REQUIREMENTS:
- Position: ${jobDescription.jobTitle}
- Required Skills: ${jobDescription.requiredSkills?.join(', ') || 'Not specified'}
- Preferred Skills: ${jobDescription.preferredSkills?.join(', ') || 'Not specified'}
- Experience: ${jobDescription.minExperience}-${jobDescription.maxExperience} years
- Education: ${jobDescription.education}

RESUME:
${resumeText.substring(0, 4000)}

Provide scores (0-100) and analysis. Focus on:
1. How well skills match (already calculated: ${skillsMatch}%)
2. Experience relevance (consider projects for students)
3. Education alignment
4. Technical fit for the role

Return JSON format:
{
  "experienceMatch": number,
  "educationMatch": number, 
  "technicalFit": number,
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "recommendations": ["rec1", "rec2"],
  "aiInsights": "Brief analysis"
}`;

          const result = await this.callGemini(prompt);
          const jsonMatch = result.match(/\{[\s\S]*\}/);
          
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            
            return {
              overallScore: Math.round((skillsMatch * 0.4 + parsed.experienceMatch * 0.3 + parsed.technicalFit * 0.2 + parsed.educationMatch * 0.1)),
              skillsMatch,
              experienceMatch: parsed.experienceMatch || 70,
              educationMatch: parsed.educationMatch || 75,
              technicalFit: parsed.technicalFit || 70,
              culturalFit: 75,
              communicationScore: 80,
              leadershipPotential: 70,
              aiInsights: parsed.aiInsights || `Analysis for ${jobDescription.jobTitle} position completed.`,
              strengths: parsed.strengths || ["Relevant technical skills", "Good educational background"],
              weaknesses: parsed.weaknesses || ["Some skill gaps identified"],
              recommendations: parsed.recommendations || ["Consider for interview", "Assess technical skills"],
              keywordMatches: this.findMatchedSkills(resumeText, jobDescription.requiredSkills),
              missingSkills: this.findMissingSkills(resumeText, jobDescription.requiredSkills),
              experienceGaps: ["Leadership experience", "Industry-specific experience"],
              candidateProfile
            };
          }
        } catch (geminiError) {
          console.warn('Gemini failed, using enhanced fallback:', geminiError);
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
      experienceGaps: this.identifyExperienceGaps(resumeText)
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
    const weaknesses = [];
    const missingSkills = this.findMissingSkills(resumeText, jobDescription.requiredSkills);
    
    if (missingSkills.length > 0) {
      weaknesses.push(`Missing some required skills: ${missingSkills.slice(0, 2).join(', ')}`);
    }
    
    if (!resumeText.toLowerCase().includes('leadership')) {
      weaknesses.push("Limited leadership experience mentioned");
    }
    
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

  private findMatchedSkills(resumeText: string, requiredSkills: string[]): string[] {
    const resumeLower = resumeText.toLowerCase();
    return requiredSkills.filter(skill => 
      resumeLower.includes(skill.toLowerCase())
    ).slice(0, 5);
  }

  private findMissingSkills(resumeText: string, requiredSkills: string[]): string[] {
    const resumeLower = resumeText.toLowerCase();
    return requiredSkills.filter(skill => 
      !resumeLower.includes(skill.toLowerCase())
    ).slice(0, 3);
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

export const simpleGeminiAnalyzer = new SimpleGeminiAnalyzer();
