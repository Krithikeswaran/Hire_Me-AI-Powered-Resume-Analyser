import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ResumeAnalysis {
  overallScore: number;
  skillsMatch: number;
  experienceMatch: number;
  communicationScore: number;
  educationMatch: number;
  aiInsights: string;
  strengths: string[];
  concerns: string[];
  recommendation: string;
  detailedAnalysis: string;
  vectorSimilarity: number;
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

class LangChainResumeAnalyzer {
  private llm: ChatOpenAI;
  private embeddings: OpenAIEmbeddings;
  private textSplitter: RecursiveCharacterTextSplitter;
  private vectorStore: MemoryVectorStore | null = null;
  private jobDescriptionVector: Document[] = [];

  constructor() {
    // Initialize with OpenAI API key (you'll need to set this)
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY || 'your-openai-api-key';
    
    this.llm = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.1, // Low temperature for consistent results
      openAIApiKey: apiKey,
    });

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: apiKey,
    });

    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
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
      // For DOCX and other formats, we'll need additional libraries
      // For now, return a placeholder
      throw new Error(`File format ${file.type} not yet supported. Please use PDF or TXT files.`);
    }
  }

  // Create vector embeddings for job description
  async createJobDescriptionVectors(jobDescription: JobDescription): Promise<void> {
    console.log('🔍 Creating job description vectors...');
    
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

    // Split job description into chunks
    const jobChunks = await this.textSplitter.splitText(jobText);
    this.jobDescriptionVector = jobChunks.map((chunk, index) => 
      new Document({
        pageContent: chunk,
        metadata: { source: 'job_description', chunk: index }
      })
    );

    // Create vector store with job description
    this.vectorStore = await MemoryVectorStore.fromDocuments(
      this.jobDescriptionVector,
      this.embeddings
    );

    console.log('✅ Job description vectors created');
  }

  // Calculate vector similarity between resume and job description
  async calculateVectorSimilarity(resumeText: string): Promise<number> {
    if (!this.vectorStore) {
      throw new Error('Job description vectors not initialized');
    }

    console.log('🔍 Calculating vector similarity...');

    // Split resume into chunks
    const resumeChunks = await this.textSplitter.splitText(resumeText);
    
    let totalSimilarity = 0;
    let chunkCount = 0;

    // Calculate similarity for each resume chunk against job description
    for (const chunk of resumeChunks) {
      const similarDocs = await this.vectorStore.similaritySearchWithScore(chunk, 3);
      
      if (similarDocs.length > 0) {
        // Get the best similarity score for this chunk
        const bestScore = Math.max(...similarDocs.map(([_, score]) => score));
        totalSimilarity += bestScore;
        chunkCount++;
      }
    }

    const averageSimilarity = chunkCount > 0 ? totalSimilarity / chunkCount : 0;
    const normalizedScore = Math.min(100, Math.max(0, averageSimilarity * 100));
    
    console.log(`✅ Vector similarity calculated: ${normalizedScore.toFixed(2)}%`);
    return normalizedScore;
  }

  // Comprehensive LLM-based resume analysis
  async analyzeResumeWithLLM(resumeText: string, jobDescription: JobDescription): Promise<ResumeAnalysis> {
    console.log('🤖 Starting LLM-based resume analysis...');

    // Create analysis prompt
    const analysisPrompt = PromptTemplate.fromTemplate(`
You are an expert HR professional and resume analyst. Analyze the following resume against the job requirements and provide a comprehensive evaluation.

JOB REQUIREMENTS:
Title: {jobTitle}
Department: {department}
Experience Level: {experienceLevel}
Required Experience: {minExperience} - {maxExperience} years
Required Skills: {requiredSkills}
Preferred Skills: {preferredSkills}
Education: {education}
Job Description: {jobDescription}
Responsibilities: {responsibilities}

RESUME TO ANALYZE:
{resumeText}

Please provide a detailed analysis with the following scores (0-100):

1. SKILLS_MATCH: How well do the candidate's skills align with required and preferred skills?
2. EXPERIENCE_MATCH: How well does their experience level and background match the requirements?
3. EDUCATION_MATCH: How well does their education align with requirements?
4. COMMUNICATION_SCORE: Based on resume writing quality, clarity, and professionalism.

Also provide:
- STRENGTHS: List 3-5 key strengths of this candidate
- CONCERNS: List any concerns or gaps
- DETAILED_ANALYSIS: 2-3 paragraph detailed analysis
- RECOMMENDATION: One of "Highly Recommended", "Recommended", "Consider", "Not Recommended"

Format your response as JSON:
{{
  "skillsMatch": <score>,
  "experienceMatch": <score>,
  "educationMatch": <score>,
  "communicationScore": <score>,
  "strengths": ["strength1", "strength2", ...],
  "concerns": ["concern1", "concern2", ...],
  "detailedAnalysis": "detailed analysis text",
  "recommendation": "recommendation"
}}
`);

    try {
      // Create the chain
      const chain = analysisPrompt.pipe(this.llm).pipe(new StringOutputParser());

      // Run the analysis
      const result = await chain.invoke({
        jobTitle: jobDescription.jobTitle,
        department: jobDescription.department,
        experienceLevel: jobDescription.experienceLevel,
        minExperience: jobDescription.minExperience,
        maxExperience: jobDescription.maxExperience,
        requiredSkills: jobDescription.requiredSkills,
        preferredSkills: jobDescription.preferredSkills,
        education: jobDescription.education,
        jobDescription: jobDescription.jobDescription,
        responsibilities: jobDescription.responsibilities,
        resumeText: resumeText.substring(0, 4000) // Limit to avoid token limits
      });

      // Parse the JSON response
      const analysis = JSON.parse(result);
      
      // Calculate vector similarity
      const vectorSimilarity = await this.calculateVectorSimilarity(resumeText);
      
      // Calculate overall score
      const overallScore = Math.round(
        (analysis.skillsMatch + analysis.experienceMatch + 
         analysis.educationMatch + analysis.communicationScore + vectorSimilarity) / 5
      );

      const finalAnalysis: ResumeAnalysis = {
        overallScore,
        skillsMatch: analysis.skillsMatch,
        experienceMatch: analysis.experienceMatch,
        communicationScore: analysis.communicationScore,
        educationMatch: analysis.educationMatch,
        aiInsights: `LLM-powered analysis with ${vectorSimilarity.toFixed(1)}% vector similarity to job requirements.`,
        strengths: analysis.strengths,
        concerns: analysis.concerns,
        recommendation: analysis.recommendation,
        detailedAnalysis: analysis.detailedAnalysis,
        vectorSimilarity
      };

      console.log('✅ LLM analysis completed:', finalAnalysis);
      return finalAnalysis;

    } catch (error) {
      console.error('Error in LLM analysis:', error);
      throw new Error(`LLM analysis failed: ${error.message}`);
    }
  }
}

// Export singleton instance
export const langchainAnalyzer = new LangChainResumeAnalyzer();

// Export types
export type { ResumeAnalysis, JobDescription };
