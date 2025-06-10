import { StateGraph, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { langchainAnalyzer, ResumeAnalysis, JobDescription } from './langchainService';

// Define the state structure for our workflow
interface WorkflowState {
  resumeFile: File;
  resumeText: string;
  jobDescription: JobDescription;
  skillsAnalysis: any;
  experienceAnalysis: any;
  educationAnalysis: any;
  communicationAnalysis: any;
  vectorAnalysis: any;
  finalAnalysis: ResumeAnalysis;
  errors: string[];
}

class ResumeAnalysisWorkflow {
  private llm: ChatOpenAI;
  private workflow: StateGraph<WorkflowState>;

  constructor() {
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY || 'your-openai-api-key';
    
    this.llm = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.1,
      openAIApiKey: apiKey,
    });

    this.workflow = this.createWorkflow();
  }

  private createWorkflow(): StateGraph<WorkflowState> {
    const workflow = new StateGraph<WorkflowState>({
      channels: {
        resumeFile: null,
        resumeText: "",
        jobDescription: null,
        skillsAnalysis: null,
        experienceAnalysis: null,
        educationAnalysis: null,
        communicationAnalysis: null,
        vectorAnalysis: null,
        finalAnalysis: null,
        errors: []
      }
    });

    // Add nodes for each analysis step
    workflow.addNode("extract_text", this.extractTextNode.bind(this));
    workflow.addNode("analyze_skills", this.analyzeSkillsNode.bind(this));
    workflow.addNode("analyze_experience", this.analyzeExperienceNode.bind(this));
    workflow.addNode("analyze_education", this.analyzeEducationNode.bind(this));
    workflow.addNode("analyze_communication", this.analyzeCommunicationNode.bind(this));
    workflow.addNode("vector_analysis", this.vectorAnalysisNode.bind(this));
    workflow.addNode("synthesize_results", this.synthesizeResultsNode.bind(this));

    // Define the workflow edges
    workflow.addEdge("extract_text", "analyze_skills");
    workflow.addEdge("analyze_skills", "analyze_experience");
    workflow.addEdge("analyze_experience", "analyze_education");
    workflow.addEdge("analyze_education", "analyze_communication");
    workflow.addEdge("analyze_communication", "vector_analysis");
    workflow.addEdge("vector_analysis", "synthesize_results");
    workflow.addEdge("synthesize_results", END);

    // Set entry point
    workflow.setEntryPoint("extract_text");

    return workflow;
  }

  // Node: Extract text from resume file
  private async extractTextNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
    try {
      console.log('📄 Extracting text from resume...');
      const resumeText = await langchainAnalyzer.extractResumeText(state.resumeFile);
      return { resumeText };
    } catch (error) {
      console.error('Error extracting text:', error);
      return { 
        errors: [...state.errors, `Text extraction failed: ${error.message}`]
      };
    }
  }

  // Node: Analyze skills match
  private async analyzeSkillsNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
    try {
      console.log('🔍 Analyzing skills match...');
      
      const skillsPrompt = PromptTemplate.fromTemplate(`
Analyze the skills in this resume against the job requirements:

REQUIRED SKILLS: {requiredSkills}
PREFERRED SKILLS: {preferredSkills}

RESUME TEXT: {resumeText}

Provide a detailed skills analysis with:
1. Score (0-100) for skills match
2. List of matched skills
3. List of missing critical skills
4. Recommendations for skill development

Format as JSON:
{{
  "score": <number>,
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill1", "skill2"],
  "recommendations": ["rec1", "rec2"]
}}
`);

      const chain = skillsPrompt.pipe(this.llm).pipe(new StringOutputParser());
      const result = await chain.invoke({
        requiredSkills: state.jobDescription.requiredSkills,
        preferredSkills: state.jobDescription.preferredSkills,
        resumeText: state.resumeText.substring(0, 3000)
      });

      const skillsAnalysis = JSON.parse(result);
      return { skillsAnalysis };
    } catch (error) {
      console.error('Error analyzing skills:', error);
      return { 
        errors: [...state.errors, `Skills analysis failed: ${error.message}`]
      };
    }
  }

  // Node: Analyze experience match
  private async analyzeExperienceNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
    try {
      console.log('💼 Analyzing experience match...');
      
      const experiencePrompt = PromptTemplate.fromTemplate(`
Analyze the work experience in this resume against the job requirements:

REQUIRED EXPERIENCE: {minExperience} - {maxExperience} years
EXPERIENCE LEVEL: {experienceLevel}
JOB RESPONSIBILITIES: {responsibilities}

RESUME TEXT: {resumeText}

Provide detailed experience analysis with:
1. Score (0-100) for experience match
2. Years of relevant experience found
3. Relevant roles and responsibilities
4. Experience gaps or concerns

Format as JSON:
{{
  "score": <number>,
  "yearsFound": <number>,
  "relevantRoles": ["role1", "role2"],
  "experienceGaps": ["gap1", "gap2"]
}}
`);

      const chain = experiencePrompt.pipe(this.llm).pipe(new StringOutputParser());
      const result = await chain.invoke({
        minExperience: state.jobDescription.minExperience,
        maxExperience: state.jobDescription.maxExperience,
        experienceLevel: state.jobDescription.experienceLevel,
        responsibilities: state.jobDescription.responsibilities,
        resumeText: state.resumeText.substring(0, 3000)
      });

      const experienceAnalysis = JSON.parse(result);
      return { experienceAnalysis };
    } catch (error) {
      console.error('Error analyzing experience:', error);
      return { 
        errors: [...state.errors, `Experience analysis failed: ${error.message}`]
      };
    }
  }

  // Node: Analyze education match
  private async analyzeEducationNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
    try {
      console.log('🎓 Analyzing education match...');
      
      const educationPrompt = PromptTemplate.fromTemplate(`
Analyze the education background in this resume against job requirements:

REQUIRED EDUCATION: {education}
JOB TITLE: {jobTitle}

RESUME TEXT: {resumeText}

Provide education analysis with:
1. Score (0-100) for education match
2. Education level found
3. Relevant field of study
4. Additional certifications

Format as JSON:
{{
  "score": <number>,
  "educationLevel": "level found",
  "fieldOfStudy": "field",
  "certifications": ["cert1", "cert2"]
}}
`);

      const chain = educationPrompt.pipe(this.llm).pipe(new StringOutputParser());
      const result = await chain.invoke({
        education: state.jobDescription.education,
        jobTitle: state.jobDescription.jobTitle,
        resumeText: state.resumeText.substring(0, 3000)
      });

      const educationAnalysis = JSON.parse(result);
      return { educationAnalysis };
    } catch (error) {
      console.error('Error analyzing education:', error);
      return { 
        errors: [...state.errors, `Education analysis failed: ${error.message}`]
      };
    }
  }

  // Node: Analyze communication skills
  private async analyzeCommunicationNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
    try {
      console.log('💬 Analyzing communication skills...');
      
      const communicationPrompt = PromptTemplate.fromTemplate(`
Analyze the communication skills and resume quality:

RESUME TEXT: {resumeText}

Evaluate:
1. Writing clarity and professionalism
2. Structure and organization
3. Achievement descriptions
4. Overall presentation quality

Provide analysis with:
1. Score (0-100) for communication skills
2. Writing quality assessment
3. Areas for improvement

Format as JSON:
{{
  "score": <number>,
  "writingQuality": "assessment",
  "improvements": ["improvement1", "improvement2"]
}}
`);

      const chain = communicationPrompt.pipe(this.llm).pipe(new StringOutputParser());
      const result = await chain.invoke({
        resumeText: state.resumeText.substring(0, 3000)
      });

      const communicationAnalysis = JSON.parse(result);
      return { communicationAnalysis };
    } catch (error) {
      console.error('Error analyzing communication:', error);
      return { 
        errors: [...state.errors, `Communication analysis failed: ${error.message}`]
      };
    }
  }

  // Node: Perform vector similarity analysis
  private async vectorAnalysisNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
    try {
      console.log('🔍 Performing vector similarity analysis...');
      
      const vectorSimilarity = await langchainAnalyzer.calculateVectorSimilarity(state.resumeText);
      
      const vectorAnalysis = {
        similarity: vectorSimilarity,
        interpretation: vectorSimilarity > 80 ? "Excellent semantic match" :
                      vectorSimilarity > 60 ? "Good semantic match" :
                      vectorSimilarity > 40 ? "Moderate semantic match" :
                      "Limited semantic match"
      };

      return { vectorAnalysis };
    } catch (error) {
      console.error('Error in vector analysis:', error);
      return { 
        errors: [...state.errors, `Vector analysis failed: ${error.message}`]
      };
    }
  }

  // Node: Synthesize all results into final analysis
  private async synthesizeResultsNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
    try {
      console.log('🔄 Synthesizing final analysis...');
      
      // Calculate overall score
      const scores = [
        state.skillsAnalysis?.score || 0,
        state.experienceAnalysis?.score || 0,
        state.educationAnalysis?.score || 0,
        state.communicationAnalysis?.score || 0,
        state.vectorAnalysis?.similarity || 0
      ];
      
      const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      
      // Determine recommendation
      const recommendation = overallScore >= 85 ? "Highly Recommended" :
                           overallScore >= 75 ? "Recommended" :
                           overallScore >= 65 ? "Consider" :
                           "Not Recommended";
      
      // Compile strengths and concerns
      const strengths = [
        ...(state.skillsAnalysis?.matchedSkills || []).slice(0, 3),
        ...(state.experienceAnalysis?.relevantRoles || []).slice(0, 2)
      ];
      
      const concerns = [
        ...(state.skillsAnalysis?.missingSkills || []).slice(0, 2),
        ...(state.experienceAnalysis?.experienceGaps || []).slice(0, 2)
      ];

      const finalAnalysis: ResumeAnalysis = {
        overallScore,
        skillsMatch: state.skillsAnalysis?.score || 0,
        experienceMatch: state.experienceAnalysis?.score || 0,
        educationMatch: state.educationAnalysis?.score || 0,
        communicationScore: state.communicationAnalysis?.score || 0,
        vectorSimilarity: state.vectorAnalysis?.similarity || 0,
        aiInsights: `Multi-agent LangGraph analysis with ${state.vectorAnalysis?.interpretation}`,
        strengths,
        concerns,
        recommendation,
        detailedAnalysis: `Comprehensive analysis using LangGraph workflow. ${state.vectorAnalysis?.interpretation}. Key strengths include ${strengths.slice(0, 2).join(', ')}. ${concerns.length > 0 ? `Areas for consideration: ${concerns.slice(0, 2).join(', ')}.` : ''}`
      };

      return { finalAnalysis };
    } catch (error) {
      console.error('Error synthesizing results:', error);
      return { 
        errors: [...state.errors, `Result synthesis failed: ${error.message}`]
      };
    }
  }

  // Execute the complete workflow
  async analyzeResume(resumeFile: File, jobDescription: JobDescription): Promise<ResumeAnalysis> {
    try {
      console.log('🚀 Starting LangGraph workflow...');
      
      // Initialize job description vectors
      await langchainAnalyzer.createJobDescriptionVectors(jobDescription);
      
      // Compile and run the workflow
      const compiledWorkflow = this.workflow.compile();
      
      const initialState: WorkflowState = {
        resumeFile,
        resumeText: "",
        jobDescription,
        skillsAnalysis: null,
        experienceAnalysis: null,
        educationAnalysis: null,
        communicationAnalysis: null,
        vectorAnalysis: null,
        finalAnalysis: null,
        errors: []
      };

      const result = await compiledWorkflow.invoke(initialState);
      
      if (result.errors && result.errors.length > 0) {
        console.warn('Workflow completed with errors:', result.errors);
      }
      
      if (!result.finalAnalysis) {
        throw new Error('Workflow failed to produce final analysis');
      }
      
      console.log('✅ LangGraph workflow completed successfully');
      return result.finalAnalysis;
      
    } catch (error) {
      console.error('Workflow execution failed:', error);
      throw new Error(`LangGraph workflow failed: ${error.message}`);
    }
  }
}

// Export singleton instance
export const resumeWorkflow = new ResumeAnalysisWorkflow();
