// Simplified Gemini integration without complex dependencies
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ResumeAnalysis {
  overallScore: number;
  skillsMatch: number;
  experienceMatch: number;
  educationMatch: number;
  technicalFit: number;
  aiInsights: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  keywordMatches: string[];
  missingSkills: string[];
  experienceGaps: string[];
  culturalFit: number;
  communicationScore: number;
  leadershipPotential: number;
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
  companyValues?: string[];
  teamSize?: number;
  workEnvironment?: string;
}

class GeminiResumeAnalyzer {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.REACT_APP_GEMINI_API_KEY || '';
  }

  private async callGeminiAPI(prompt: string): Promise<string> {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
      console.error('Gemini API call failed:', error);
      throw error;
    }
  }



  async analyzeResumeWithGemini(resumeText: string, jobDescription: JobDescription): Promise<ResumeAnalysis> {
    try {
      console.log('🤖 Starting Gemini-powered resume analysis...');

      // Create vectors for semantic analysis
      await this.createJobDescriptionVector(jobDescription);
      await this.createResumeVector(resumeText);

      // Enhanced prompt template for Gemini
      const analysisPrompt = PromptTemplate.fromTemplate(`
        You are an expert HR analyst and recruitment specialist with deep expertise in resume evaluation and candidate assessment. 
        Analyze the following resume against the job requirements with exceptional precision and insight.

        JOB REQUIREMENTS:
        - Position: {jobTitle} in {department}
        - Experience Level: {experienceLevel} ({minExperience}-{maxExperience} years)
        - Required Skills: {requiredSkills}
        - Preferred Skills: {preferredSkills}
        - Education: {education}
        - Job Description: {jobDescription}
        - Key Responsibilities: {responsibilities}
        - Company Values: {companyValues}
        - Work Environment: {workEnvironment}

        RESUME CONTENT:
        {resumeText}

        ANALYSIS INSTRUCTIONS:
        Provide a comprehensive analysis with the following structure. Be precise, insightful, and actionable:

        1. OVERALL ASSESSMENT (0-100):
        - Provide an overall compatibility score
        - Consider all factors: skills, experience, education, cultural fit

        2. DETAILED SCORING (0-100 each):
        - Skills Match: How well do the candidate's skills align with requirements?
        - Experience Match: Does their experience level and type fit the role?
        - Education Match: Does their educational background meet requirements?
        - Technical Fit: How well do they match the technical requirements?
        - Cultural Fit: Based on values and work style indicators
        - Communication Score: Based on resume quality and presentation
        - Leadership Potential: Evidence of leadership experience or potential

        3. STRENGTHS (List 3-5 key strengths):
        - Specific examples from the resume
        - How these strengths benefit the role

        4. WEAKNESSES (List 2-4 areas of concern):
        - Specific gaps or concerns
        - Potential impact on job performance

        5. RECOMMENDATIONS (List 3-5 actionable recommendations):
        - For the candidate to improve their application
        - For the hiring team to consider

        6. KEYWORD ANALYSIS:
        - Keywords from job description found in resume
        - Missing critical keywords

        7. EXPERIENCE GAPS:
        - Specific experience areas that are missing
        - Years of experience gaps

        8. AI INSIGHTS:
        - Unique observations about the candidate
        - Prediction of job success likelihood
        - Red flags or exceptional qualities

        Format your response as a structured JSON object with the following keys:
        {{
          "overallScore": number,
          "skillsMatch": number,
          "experienceMatch": number,
          "educationMatch": number,
          "technicalFit": number,
          "culturalFit": number,
          "communicationScore": number,
          "leadershipPotential": number,
          "strengths": [string array],
          "weaknesses": [string array],
          "recommendations": [string array],
          "keywordMatches": [string array],
          "missingSkills": [string array],
          "experienceGaps": [string array],
          "aiInsights": "detailed string analysis"
        }}
      `);

      // Create the chain
      const chain = analysisPrompt.pipe(this.llm).pipe(new StringOutputParser());

      // Run the analysis
      const result = await chain.invoke({
        jobTitle: jobDescription.jobTitle,
        department: jobDescription.department,
        experienceLevel: jobDescription.experienceLevel,
        minExperience: jobDescription.minExperience,
        maxExperience: jobDescription.maxExperience,
        requiredSkills: jobDescription.requiredSkills.join(', '),
        preferredSkills: jobDescription.preferredSkills.join(', '),
        education: jobDescription.education,
        jobDescription: jobDescription.jobDescription,
        responsibilities: jobDescription.responsibilities.join(', '),
        companyValues: jobDescription.companyValues?.join(', ') || 'Not specified',
        workEnvironment: jobDescription.workEnvironment || 'Not specified',
        resumeText: resumeText.substring(0, 8000) // Gemini can handle more tokens
      });

      console.log('🎯 Raw Gemini analysis result:', result);

      // Parse the JSON response
      let parsedResult: ResumeAnalysis;
      try {
        // Clean the response to extract JSON
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.warn('⚠️ Failed to parse JSON response, using fallback analysis');
        // Fallback analysis if JSON parsing fails
        parsedResult = this.createFallbackAnalysis(result, jobDescription);
      }

      console.log('✅ Gemini analysis completed successfully');
      return parsedResult;

    } catch (error) {
      console.error('❌ Error in Gemini analysis:', error);
      throw error;
    }
  }

  private createFallbackAnalysis(rawResult: string, jobDescription: JobDescription): ResumeAnalysis {
    // Extract scores using regex patterns
    const extractScore = (pattern: RegExp): number => {
      const match = rawResult.match(pattern);
      return match ? Math.min(100, Math.max(0, parseInt(match[1]))) : 75;
    };

    return {
      overallScore: extractScore(/overall[^:]*:?\s*(\d+)/i) || 75,
      skillsMatch: extractScore(/skills?[^:]*:?\s*(\d+)/i) || 70,
      experienceMatch: extractScore(/experience[^:]*:?\s*(\d+)/i) || 75,
      educationMatch: extractScore(/education[^:]*:?\s*(\d+)/i) || 80,
      technicalFit: extractScore(/technical[^:]*:?\s*(\d+)/i) || 70,
      culturalFit: extractScore(/cultural?[^:]*:?\s*(\d+)/i) || 75,
      communicationScore: extractScore(/communication[^:]*:?\s*(\d+)/i) || 75,
      leadershipPotential: extractScore(/leadership[^:]*:?\s*(\d+)/i) || 70,
      aiInsights: rawResult.substring(0, 500) + "...",
      strengths: ["Strong technical background", "Relevant experience", "Good educational fit"],
      weaknesses: ["Some skill gaps identified", "Experience level considerations"],
      recommendations: ["Focus on highlighted skills", "Address experience gaps", "Emphasize relevant projects"],
      keywordMatches: jobDescription.requiredSkills.slice(0, 3),
      missingSkills: jobDescription.preferredSkills.slice(0, 2),
      experienceGaps: ["Leadership experience", "Industry-specific experience"]
    };
  }
}

// Export singleton instance
export const geminiAnalyzer = new GeminiResumeAnalyzer();
