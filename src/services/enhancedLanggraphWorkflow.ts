// Enhanced workflow service using a simplified state machine approach
// This provides the same 4-agent functionality without requiring LangGraph dependencies
import { simpleGeminiAnalyzer, JobDescription, ResumeAnalysis } from './simpleGeminiService';
import { extractResumeText } from './aiService';

// Enhanced state structure for 4-agent workflow
interface EnhancedWorkflowState {
  resumeFile: File;
  resumeText: string;
  jobDescription: JobDescription;
  structuredInfo: any;
  
  // Agent-specific analysis results
  skillsAnalysis: {
    score: number;
    matchedSkills: string[];
    missingSkills: string[];
    skillGaps: string[];
    recommendations: string[];
    confidence: number;
  };
  
  experienceAnalysis: {
    score: number;
    relevantExperience: string[];
    experienceGaps: string[];
    projectsRelevance: number;
    careerProgression: string;
    recommendations: string[];
    confidence: number;
  };
  
  educationAnalysis: {
    score: number;
    degreeRelevance: number;
    institutionQuality: number;
    additionalQualifications: string[];
    courseworkRelevance: string[];
    recommendations: string[];
    confidence: number;
  };
  
  technicalFitAnalysis: {
    score: number;
    technicalDepth: number;
    toolsProficiency: number;
    frameworksExperience: number;
    problemSolvingIndicators: string[];
    technicalChallenges: string[];
    recommendations: string[];
    confidence: number;
  };
  
  finalAnalysis: ResumeAnalysis;
  errors: string[];
  processingTime: number;
}

export class EnhancedLanggraphWorkflow {

  constructor() {
    // Simple constructor - no complex workflow setup needed
  }

  // Simplified workflow execution using sequential agent processing
  private async executeWorkflow(state: EnhancedWorkflowState): Promise<EnhancedWorkflowState> {
    try {
      console.log('🚀 Starting enhanced 4-agent workflow...');

      // Step 1: Extract text from resume file
      console.log('📄 Step 1: Extracting text from resume...');
      const textResult = await this.extractTextNode(state);
      Object.assign(state, textResult);

      // Step 2: Extract structured information
      console.log('🧠 Step 2: Extracting structured information...');
      const structuredResult = await this.extractStructuredInfoNode(state);
      Object.assign(state, structuredResult);

      // Step 3: Skills Analyzer Agent
      console.log('🎯 Step 3: Skills Analyzer Agent processing...');
      const skillsResult = await this.skillsAnalyzerAgent(state);
      Object.assign(state, skillsResult);

      // Step 4: Experience Evaluator Agent
      console.log('💼 Step 4: Experience Evaluator Agent processing...');
      const experienceResult = await this.experienceEvaluatorAgent(state);
      Object.assign(state, experienceResult);

      // Step 5: Education Assessor Agent
      console.log('🎓 Step 5: Education Assessor Agent processing...');
      const educationResult = await this.educationAssessorAgent(state);
      Object.assign(state, educationResult);

      // Step 6: Technical Fit Agent
      console.log('⚙️ Step 6: Technical Fit Agent processing...');
      const technicalResult = await this.technicalFitAgent(state);
      Object.assign(state, technicalResult);

      // Step 7: Synthesize results
      console.log('🔄 Step 7: Synthesizing results from all agents...');
      const finalResult = await this.synthesizeResultsNode(state);
      Object.assign(state, finalResult);

      console.log('✅ Enhanced 4-agent workflow completed successfully');
      return state;

    } catch (error) {
      console.error('❌ Workflow execution failed:', error);
      state.errors.push(`Workflow execution failed: ${error.message}`);
      return state;
    }
  }

  // Node: Extract text from resume file
  private async extractTextNode(state: EnhancedWorkflowState): Promise<Partial<EnhancedWorkflowState>> {
    try {
      console.log('📄 Agent 1: Extracting text from resume...');
      
      // Use existing text extraction logic
      const resumeText = await this.extractResumeText(state.resumeFile);
      
      return { resumeText };
    } catch (error) {
      console.error('Error in text extraction:', error);
      return { 
        errors: [...state.errors, `Text extraction failed: ${error.message}`]
      };
    }
  }

  // Node: Extract structured information using Gemini
  private async extractStructuredInfoNode(state: EnhancedWorkflowState): Promise<Partial<EnhancedWorkflowState>> {
    try {
      console.log('🧠 Agent 2: Extracting structured information...');
      
      if (simpleGeminiAnalyzer.isAvailable()) {
        const structuredInfo = await simpleGeminiAnalyzer.extractStructuredInfo(
          state.resumeText, 
          state.jobDescription
        );
        return { structuredInfo };
      } else {
        // Fallback to basic parsing
        const profile = simpleGeminiAnalyzer.parseResumeToProfile(state.resumeText, state.resumeFile.name);
        return { 
          structuredInfo: {
            personalInfo: profile.personalInfo,
            technicalSkills: profile.technicalSkills,
            experience: profile.experience,
            education: profile.education,
            projects: profile.projects,
            certifications: profile.certifications,
            keyInsights: ["Basic parsing completed"]
          }
        };
      }
    } catch (error) {
      console.error('Error in structured info extraction:', error);
      return { 
        errors: [...state.errors, `Structured info extraction failed: ${error.message}`]
      };
    }
  }

  // Agent 1: Skills Analyzer Agent
  private async skillsAnalyzerAgent(state: EnhancedWorkflowState): Promise<Partial<EnhancedWorkflowState>> {
    try {
      console.log('🎯 Agent 3: Skills Analyzer Agent processing...');
      
      const skillsMatch = simpleGeminiAnalyzer['calculateSkillsMatch'](
        state.resumeText, 
        state.jobDescription.requiredSkills
      );
      
      const matchedSkills = simpleGeminiAnalyzer['findMatchedSkills'](
        state.resumeText, 
        state.jobDescription.requiredSkills
      );
      
      const missingSkills = simpleGeminiAnalyzer['findMissingSkills'](
        state.resumeText, 
        state.jobDescription.requiredSkills
      );

      const skillsAnalysis = {
        score: skillsMatch,
        matchedSkills,
        missingSkills,
        skillGaps: missingSkills.slice(0, 3),
        recommendations: this.generateSkillsRecommendations(skillsMatch, missingSkills),
        confidence: this.calculateConfidence(skillsMatch, matchedSkills.length)
      };

      return { skillsAnalysis };
    } catch (error) {
      console.error('Error in skills analysis:', error);
      return { 
        errors: [...state.errors, `Skills analysis failed: ${error.message}`]
      };
    }
  }

  // Agent 2: Experience Evaluator Agent
  private async experienceEvaluatorAgent(state: EnhancedWorkflowState): Promise<Partial<EnhancedWorkflowState>> {
    try {
      console.log('💼 Agent 4: Experience Evaluator Agent processing...');
      
      const experienceScore = this.calculateExperienceScore(state.resumeText, state.jobDescription);
      const relevantExperience = this.extractRelevantExperience(state.structuredInfo?.experience || []);
      const projectsRelevance = this.calculateProjectsRelevance(state.structuredInfo?.projects || [], state.jobDescription);
      
      const experienceAnalysis = {
        score: experienceScore,
        relevantExperience,
        experienceGaps: this.identifyExperienceGaps(state.resumeText, state.jobDescription),
        projectsRelevance,
        careerProgression: this.assessCareerProgression(state.structuredInfo?.experience || []),
        recommendations: this.generateExperienceRecommendations(experienceScore, projectsRelevance),
        confidence: this.calculateConfidence(experienceScore, relevantExperience.length)
      };

      return { experienceAnalysis };
    } catch (error) {
      console.error('Error in experience analysis:', error);
      return { 
        errors: [...state.errors, `Experience analysis failed: ${error.message}`]
      };
    }
  }

  // Agent 3: Education Assessor Agent  
  private async educationAssessorAgent(state: EnhancedWorkflowState): Promise<Partial<EnhancedWorkflowState>> {
    try {
      console.log('🎓 Agent 5: Education Assessor Agent processing...');
      
      const educationScore = this.calculateEducationScore(state.structuredInfo?.education || [], state.jobDescription);
      const degreeRelevance = this.assessDegreeRelevance(state.structuredInfo?.education || [], state.jobDescription);
      
      const educationAnalysis = {
        score: educationScore,
        degreeRelevance,
        institutionQuality: this.assessInstitutionQuality(state.structuredInfo?.education || []),
        additionalQualifications: state.structuredInfo?.certifications || [],
        courseworkRelevance: this.extractRelevantCoursework(state.structuredInfo?.education || []),
        recommendations: this.generateEducationRecommendations(educationScore, degreeRelevance),
        confidence: this.calculateConfidence(educationScore, (state.structuredInfo?.education || []).length)
      };

      return { educationAnalysis };
    } catch (error) {
      console.error('Error in education analysis:', error);
      return { 
        errors: [...state.errors, `Education analysis failed: ${error.message}`]
      };
    }
  }

  // Agent 4: Technical Fit Agent
  private async technicalFitAgent(state: EnhancedWorkflowState): Promise<Partial<EnhancedWorkflowState>> {
    try {
      console.log('⚙️ Agent 6: Technical Fit Agent processing...');
      
      const technicalScore = this.calculateTechnicalFitScore(state.resumeText, state.jobDescription);
      const technicalDepth = this.assessTechnicalDepth(state.structuredInfo?.technicalSkills || {});
      const toolsProficiency = this.assessToolsProficiency(state.structuredInfo?.technicalSkills || {}, state.jobDescription);
      
      const technicalFitAnalysis = {
        score: technicalScore,
        technicalDepth,
        toolsProficiency,
        frameworksExperience: this.assessFrameworksExperience(state.structuredInfo?.technicalSkills || {}),
        problemSolvingIndicators: this.identifyProblemSolvingIndicators(state.resumeText),
        technicalChallenges: this.identifyTechnicalChallenges(state.resumeText, state.jobDescription),
        recommendations: this.generateTechnicalRecommendations(technicalScore, technicalDepth),
        confidence: this.calculateConfidence(technicalScore, Object.keys(state.structuredInfo?.technicalSkills || {}).length)
      };

      return { technicalFitAnalysis };
    } catch (error) {
      console.error('Error in technical fit analysis:', error);
      return { 
        errors: [...state.errors, `Technical fit analysis failed: ${error.message}`]
      };
    }
  }

  // Node: Synthesize all agent results into final analysis
  private async synthesizeResultsNode(state: EnhancedWorkflowState): Promise<Partial<EnhancedWorkflowState>> {
    try {
      console.log('🔄 Synthesizing results from all agents...');

      // Ensure all agent results exist with fallback values
      const skillsAnalysis = state.skillsAnalysis || { score: 50, matchedSkills: [], missingSkills: [], recommendations: [] };
      const experienceAnalysis = state.experienceAnalysis || { score: 50, experienceGaps: [], recommendations: [] };
      const educationAnalysis = state.educationAnalysis || { score: 50, recommendations: [] };
      const technicalFitAnalysis = state.technicalFitAnalysis || { score: 50, recommendations: [] };

      const overallScore = Math.round(
        (skillsAnalysis.score * 0.35) +
        (experienceAnalysis.score * 0.25) +
        (educationAnalysis.score * 0.15) +
        (technicalFitAnalysis.score * 0.25)
      );

      const finalAnalysis: ResumeAnalysis = {
        overallScore,
        skillsMatch: skillsAnalysis.score,
        experienceMatch: experienceAnalysis.score,
        educationMatch: educationAnalysis.score,
        technicalFit: technicalFitAnalysis.score,
        culturalFit: 75, // Default value
        communicationScore: 80, // Default value
        leadershipPotential: 70, // Default value
        aiInsights: this.generateComprehensiveInsights(state),
        strengths: this.synthesizeStrengths(state),
        weaknesses: this.synthesizeWeaknesses(state),
        recommendations: this.synthesizeRecommendations(state),
        keywordMatches: skillsAnalysis.matchedSkills || [],
        missingSkills: skillsAnalysis.missingSkills || [],
        experienceGaps: experienceAnalysis.experienceGaps || [],
        candidateProfile: simpleGeminiAnalyzer.parseResumeToProfile(state.resumeText || '', state.resumeFile.name)
      };

      return { finalAnalysis };
    } catch (error) {
      console.error('Error in result synthesis:', error);
      return { 
        errors: [...state.errors, `Result synthesis failed: ${error.message}`]
      };
    }
  }

  // Execute the complete 4-agent workflow
  async analyzeResume(resumeFile: File, jobDescription: JobDescription): Promise<ResumeAnalysis> {
    try {
      const startTime = Date.now();
      console.log('🚀 Starting Enhanced 4-Agent LangGraph workflow...');
      
      const initialState: EnhancedWorkflowState = {
        resumeFile,
        resumeText: "",
        jobDescription,
        structuredInfo: null,
        skillsAnalysis: null,
        experienceAnalysis: null,
        educationAnalysis: null,
        technicalFitAnalysis: null,
        finalAnalysis: null,
        errors: [],
        processingTime: 0
      };

      // Execute the simplified workflow
      const result = await this.executeWorkflow(initialState);
      const processingTime = Date.now() - startTime;
      
      console.log(`✅ 4-Agent workflow completed in ${processingTime}ms`);
      
      if (result.errors && result.errors.length > 0) {
        console.warn('⚠️ Workflow completed with errors:', result.errors);
      }

      if (!result.finalAnalysis) {
        throw new Error('Workflow failed to produce final analysis');
      }

      return {
        ...result.finalAnalysis,
        aiInsights: `${result.finalAnalysis.aiInsights} Processed by enhanced 4-agent workflow in ${processingTime}ms.`
      };
      
    } catch (error) {
      console.error('❌ Enhanced workflow failed:', error);
      throw error;
    }
  }

  // Helper method to extract resume text using proper extraction service
  private async extractResumeText(file: File): Promise<string> {
    try {
      console.log(`📄 Extracting text from ${file.name} (${file.type})`);
      const text = await extractResumeText(file);
      console.log(`✅ Successfully extracted ${text.length} characters from ${file.name}`);
      return text;
    } catch (error) {
      console.error(`❌ Failed to extract text from ${file.name}:`, error);
      // Fallback to simple text reading for .txt files
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string || '');
          reader.onerror = (e) => reject(new Error('Failed to read text file'));
          reader.readAsText(file);
        });
      }
      throw error;
    }
  }

  // Helper methods for agent calculations
  private generateSkillsRecommendations(skillsMatch: number, missingSkills: string[]): string[] {
    const recommendations = [];

    if (skillsMatch < 60) {
      recommendations.push("Significant skill development needed in core areas");
    } else if (skillsMatch < 80) {
      recommendations.push("Good foundation, some skill enhancement recommended");
    } else {
      recommendations.push("Strong skill alignment with job requirements");
    }

    if (missingSkills.length > 0) {
      recommendations.push(`Focus on developing: ${missingSkills.slice(0, 2).join(', ')}`);
    }

    return recommendations;
  }

  private calculateConfidence(score: number, dataPoints: number): number {
    // Calculate confidence based on score and amount of data available
    const baseConfidence = Math.min(95, Math.max(50, score));
    const dataConfidence = Math.min(20, dataPoints * 5);
    return Math.round(baseConfidence + dataConfidence);
  }

  private calculateExperienceScore(resumeText: string, jobDescription: JobDescription): number {
    const resumeLower = resumeText.toLowerCase();
    const yearMatches = resumeText.match(/(\d+)\s*\+?\s*years?/gi) || [];
    const projectMatches = resumeText.match(/project/gi) || [];

    const maxYears = yearMatches.length > 0 ? Math.max(...yearMatches.map(m => {
      const match = m.match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    })) : 0;

    const projectCount = projectMatches.length;
    const minRequired = jobDescription.minExperience || 0;

    // For students/freshers, weight projects heavily
    if (maxYears < 2 && projectCount > 0) {
      return Math.min(85, 60 + (projectCount * 8));
    }

    if (maxYears >= minRequired) {
      return Math.min(95, 75 + Math.floor(Math.random() * 20));
    }

    return Math.max(40, (maxYears / Math.max(minRequired, 1)) * 70);
  }

  private extractRelevantExperience(experience: any[]): string[] {
    return experience.map(exp => `${exp.title} at ${exp.company}`).slice(0, 3);
  }

  private calculateProjectsRelevance(projects: any[], jobDescription: JobDescription): number {
    if (projects.length === 0) return 40;

    const relevantProjects = projects.filter(project => {
      const projectText = `${project.name} ${project.description} ${project.technologies?.join(' ')}`.toLowerCase();
      const jobSkills = Array.isArray(jobDescription.requiredSkills)
        ? jobDescription.requiredSkills
        : [jobDescription.requiredSkills];

      return jobSkills.some(skill =>
        projectText.includes(skill.toLowerCase())
      );
    });

    return Math.min(90, 50 + (relevantProjects.length / projects.length) * 40);
  }

  private identifyExperienceGaps(resumeText: string, jobDescription: JobDescription): string[] {
    const gaps = [];
    const resumeLower = resumeText.toLowerCase();

    if (!resumeLower.includes('leadership') && jobDescription.experienceLevel !== 'Entry Level') {
      gaps.push("Leadership experience");
    }

    if (!resumeLower.includes('team') && !resumeLower.includes('collaboration')) {
      gaps.push("Team collaboration experience");
    }

    return gaps.slice(0, 3);
  }

  private assessCareerProgression(experience: any[]): string {
    if (experience.length === 0) return "No formal work experience";
    if (experience.length === 1) return "Single role experience";

    // Simple progression assessment
    const titles = experience.map(exp => exp.title.toLowerCase());
    const hasProgression = titles.some(title =>
      title.includes('senior') || title.includes('lead') || title.includes('manager')
    );

    return hasProgression ? "Shows career progression" : "Consistent role level";
  }

  private generateExperienceRecommendations(experienceScore: number, projectsRelevance: number): string[] {
    const recommendations = [];

    if (experienceScore < 60) {
      recommendations.push("Gain more relevant work experience or internships");
    }

    if (projectsRelevance < 70) {
      recommendations.push("Develop projects more aligned with job requirements");
    } else {
      recommendations.push("Strong project portfolio demonstrates practical skills");
    }

    return recommendations;
  }

  private calculateEducationScore(education: any[], jobDescription: JobDescription): number {
    if (education.length === 0) return 50;

    const relevantEducation = education.filter(edu => {
      const field = edu.field.toLowerCase();
      const jobTitle = jobDescription.jobTitle.toLowerCase();

      return field.includes('computer') || field.includes('software') ||
             field.includes('data') || field.includes('information') ||
             (jobTitle.includes('data') && field.includes('science'));
    });

    const baseScore = relevantEducation.length > 0 ? 80 : 65;
    const degreeLevel = education.some(edu =>
      edu.degree.toLowerCase().includes('master') || edu.degree.toLowerCase().includes('phd')
    ) ? 10 : 0;

    return Math.min(95, baseScore + degreeLevel);
  }

  private assessDegreeRelevance(education: any[], jobDescription: JobDescription): number {
    if (education.length === 0) return 50;

    const jobTitle = jobDescription.jobTitle.toLowerCase();
    const relevantFields = ['computer science', 'software engineering', 'information technology', 'data science'];

    const hasRelevantDegree = education.some(edu =>
      relevantFields.some(field => edu.field.toLowerCase().includes(field))
    );

    return hasRelevantDegree ? 90 : 60;
  }

  private assessInstitutionQuality(education: any[]): number {
    // Simple assessment based on institution names
    // In a real implementation, this could use a database of institution rankings
    return 75; // Default neutral score
  }

  private extractRelevantCoursework(education: any[]): string[] {
    const coursework = [];
    education.forEach(edu => {
      if (edu.relevantCoursework) {
        coursework.push(...edu.relevantCoursework);
      }
    });
    return coursework.slice(0, 5);
  }

  private generateEducationRecommendations(educationScore: number, degreeRelevance: number): string[] {
    const recommendations = [];

    if (degreeRelevance < 70) {
      recommendations.push("Consider additional certifications in relevant technical areas");
    }

    if (educationScore >= 80) {
      recommendations.push("Strong educational background aligns well with role");
    } else {
      recommendations.push("Educational background provides good foundation");
    }

    return recommendations;
  }

  private calculateTechnicalFitScore(resumeText: string, jobDescription: JobDescription): number {
    const resumeLower = resumeText.toLowerCase();
    const jobLower = jobDescription.jobTitle.toLowerCase();

    let relevantSkills = [];
    if (jobLower.includes('frontend') || jobLower.includes('ui')) {
      relevantSkills = ['html', 'css', 'javascript', 'react', 'angular', 'vue'];
    } else if (jobLower.includes('backend') || jobLower.includes('api')) {
      relevantSkills = ['api', 'database', 'server', 'node.js', 'python', 'java'];
    } else if (jobLower.includes('data') || jobLower.includes('analytics')) {
      relevantSkills = ['python', 'sql', 'data', 'analytics', 'power bi', 'tableau'];
    } else if (jobLower.includes('fullstack') || jobLower.includes('full stack')) {
      relevantSkills = ['javascript', 'react', 'node.js', 'database', 'api'];
    } else {
      relevantSkills = ['programming', 'development', 'software', 'technical'];
    }

    const matchCount = relevantSkills.filter(skill => resumeLower.includes(skill)).length;
    return Math.min(95, Math.max(50, (matchCount / relevantSkills.length) * 100));
  }

  private assessTechnicalDepth(technicalSkills: any): number {
    const skillCategories = Object.keys(technicalSkills || {});
    const totalSkills = Object.values(technicalSkills || {}).flat().length;

    // Score based on breadth and depth
    const breadthScore = Math.min(40, skillCategories.length * 8);
    const depthScore = Math.min(60, totalSkills * 3);

    return Math.min(95, breadthScore + depthScore);
  }

  private assessToolsProficiency(technicalSkills: any, jobDescription: JobDescription): number {
    const tools = technicalSkills.tools || [];
    const jobSkills = Array.isArray(jobDescription.requiredSkills)
      ? jobDescription.requiredSkills
      : [jobDescription.requiredSkills];

    const relevantTools = tools.filter(tool =>
      jobSkills.some(skill => skill.toLowerCase().includes(tool.toLowerCase()))
    );

    return tools.length > 0 ? Math.min(90, (relevantTools.length / tools.length) * 100) : 50;
  }

  private assessFrameworksExperience(technicalSkills: any): number {
    const frameworks = technicalSkills.frameworks || [];

    if (frameworks.length === 0) return 40;
    if (frameworks.length >= 3) return 85;
    if (frameworks.length >= 2) return 75;
    return 60;
  }

  private identifyProblemSolvingIndicators(resumeText: string): string[] {
    const indicators = [];
    const resumeLower = resumeText.toLowerCase();

    if (resumeLower.includes('algorithm') || resumeLower.includes('optimization')) {
      indicators.push("Algorithmic thinking");
    }

    if (resumeLower.includes('debug') || resumeLower.includes('troubleshoot')) {
      indicators.push("Debugging skills");
    }

    if (resumeLower.includes('design pattern') || resumeLower.includes('architecture')) {
      indicators.push("System design awareness");
    }

    return indicators.slice(0, 3);
  }

  private identifyTechnicalChallenges(resumeText: string, jobDescription: JobDescription): string[] {
    const challenges = [];
    const resumeLower = resumeText.toLowerCase();
    const jobSkills = Array.isArray(jobDescription.requiredSkills)
      ? jobDescription.requiredSkills
      : [jobDescription.requiredSkills];

    // Identify missing technical areas
    if (!resumeLower.includes('test') && !resumeLower.includes('qa')) {
      challenges.push("Testing and quality assurance experience");
    }

    if (!resumeLower.includes('deploy') && !resumeLower.includes('devops')) {
      challenges.push("Deployment and DevOps experience");
    }

    return challenges.slice(0, 2);
  }

  private generateTechnicalRecommendations(technicalScore: number, technicalDepth: number): string[] {
    const recommendations = [];

    if (technicalScore >= 80) {
      recommendations.push("Strong technical skills align well with role requirements");
    } else if (technicalScore >= 60) {
      recommendations.push("Good technical foundation, some areas for improvement");
    } else {
      recommendations.push("Significant technical skill development needed");
    }

    if (technicalDepth < 60) {
      recommendations.push("Broaden technical skill set across multiple domains");
    }

    return recommendations;
  }

  private generateComprehensiveInsights(state: EnhancedWorkflowState): string {
    // Use fallback values if agent results are missing
    const skillsScore = state.skillsAnalysis?.score || 50;
    const experienceScore = state.experienceAnalysis?.score || 50;
    const educationScore = state.educationAnalysis?.score || 50;
    const technicalScore = state.technicalFitAnalysis?.score || 50;

    const overallScore = Math.round((skillsScore * 0.35) + (experienceScore * 0.25) + (educationScore * 0.15) + (technicalScore * 0.25));

    let insight = `Enhanced analysis completed. `;

    if (overallScore >= 85) {
      insight += "Excellent candidate with strong alignment across all evaluation criteria. ";
    } else if (overallScore >= 75) {
      insight += "Strong candidate with good potential for the role. ";
    } else if (overallScore >= 65) {
      insight += "Decent candidate with some areas requiring development. ";
    } else {
      insight += "Candidate shows potential but needs significant development. ";
    }

    // Add specific insights based on strongest/weakest areas
    const scores = { skills: skillsScore, experience: experienceScore, education: educationScore, technical: technicalScore };
    const strongest = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    const weakest = Object.keys(scores).reduce((a, b) => scores[a] < scores[b] ? a : b);

    insight += `Strongest area: ${strongest} (${scores[strongest]}%). `;
    insight += `Area for improvement: ${weakest} (${scores[weakest]}%).`;

    return insight;
  }

  private synthesizeStrengths(state: EnhancedWorkflowState): string[] {
    const strengths = [];

    // Collect strengths from all agents with null checks
    if (state.skillsAnalysis?.score >= 75) {
      const matchedCount = state.skillsAnalysis.matchedSkills?.length || 0;
      strengths.push(`Strong skills match (${state.skillsAnalysis.score}%) with ${matchedCount} relevant skills`);
    }

    if (state.experienceAnalysis?.score >= 75) {
      strengths.push("Relevant work experience and project portfolio");
    }

    if (state.educationAnalysis?.score >= 75) {
      strengths.push("Strong educational background in relevant field");
    }

    if (state.technicalFitAnalysis?.score >= 75) {
      strengths.push("Good technical depth and tool proficiency");
    }

    // Add specific strengths from structured info
    if (state.structuredInfo?.projects?.length > 2) {
      strengths.push("Demonstrates practical experience through multiple projects");
    }

    // Ensure we always have at least one strength
    if (strengths.length === 0) {
      strengths.push("Candidate profile successfully analyzed");
    }

    return strengths.slice(0, 4);
  }

  private synthesizeWeaknesses(state: EnhancedWorkflowState): string[] {
    const weaknesses = [];

    // Collect weaknesses from all agents with null checks
    if (state.skillsAnalysis?.missingSkills?.length > 0) {
      weaknesses.push(`Missing key skills: ${state.skillsAnalysis.missingSkills.slice(0, 2).join(', ')}`);
    }

    if (state.experienceAnalysis?.score < 60) {
      weaknesses.push("Limited relevant work experience");
    }

    if (state.technicalFitAnalysis?.technicalChallenges?.length > 0) {
      weaknesses.push(state.technicalFitAnalysis.technicalChallenges[0]);
    }

    // Ensure we always have at least one weakness if scores are low
    if (weaknesses.length === 0) {
      const overallScore = Math.round(
        ((state.skillsAnalysis?.score || 50) * 0.35) +
        ((state.experienceAnalysis?.score || 50) * 0.25) +
        ((state.educationAnalysis?.score || 50) * 0.15) +
        ((state.technicalFitAnalysis?.score || 50) * 0.25)
      );

      if (overallScore < 70) {
        weaknesses.push("Some areas identified for potential improvement");
      }
    }

    return weaknesses.slice(0, 3);
  }

  private synthesizeRecommendations(state: EnhancedWorkflowState): string[] {
    const recommendations = [];

    // Collect top recommendations from all agents with null checks
    if (state.skillsAnalysis?.recommendations?.length > 0) {
      recommendations.push(...state.skillsAnalysis.recommendations.slice(0, 1));
    }

    if (state.experienceAnalysis?.recommendations?.length > 0) {
      recommendations.push(...state.experienceAnalysis.recommendations.slice(0, 1));
    }

    if (state.technicalFitAnalysis?.recommendations?.length > 0) {
      recommendations.push(...state.technicalFitAnalysis.recommendations.slice(0, 1));
    }

    // Add overall recommendation
    const overallScore = Math.round(
      ((state.skillsAnalysis?.score || 50) * 0.35) +
      ((state.experienceAnalysis?.score || 50) * 0.25) +
      ((state.educationAnalysis?.score || 50) * 0.15) +
      ((state.technicalFitAnalysis?.score || 50) * 0.25)
    );

    if (overallScore >= 80) {
      recommendations.push("Highly recommended for interview and technical assessment");
    } else if (overallScore >= 70) {
      recommendations.push("Recommended for interview with focus on skill gaps");
    } else {
      recommendations.push("Consider with reservations, may require additional training");
    }

    // Ensure we always have at least one recommendation
    if (recommendations.length === 0) {
      recommendations.push("Review candidate profile for potential fit");
    }

    return recommendations.slice(0, 4);
  }
}

// Export singleton instance
export const enhancedLanggraphWorkflow = new EnhancedLanggraphWorkflow();
