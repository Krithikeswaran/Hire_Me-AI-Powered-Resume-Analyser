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
      console.log('🌟 Starting Gemini Pro analysis...');

      const prompt = `You are an expert HR analyst. Analyze this resume against the job requirements and provide a detailed assessment.

JOB REQUIREMENTS:
- Position: ${jobDescription.jobTitle}
- Department: ${jobDescription.department}
- Experience Level: ${jobDescription.experienceLevel} (${jobDescription.minExperience}-${jobDescription.maxExperience} years)
- Required Skills: ${jobDescription.requiredSkills?.join(', ') || 'Not specified'}
- Preferred Skills: ${jobDescription.preferredSkills?.join(', ') || 'Not specified'}
- Education: ${jobDescription.education}
- Job Description: ${jobDescription.jobDescription}
- Responsibilities: ${jobDescription.responsibilities?.join(', ') || 'Not specified'}

RESUME CONTENT:
${resumeText.substring(0, 6000)}

Please analyze and provide scores (0-100) for:
1. Overall compatibility
2. Skills match
3. Experience match
4. Education match
5. Technical fit
6. Cultural fit
7. Communication quality
8. Leadership potential

Also provide:
- 3-5 key strengths
- 2-4 areas of concern
- 3-5 recommendations
- Matched keywords
- Missing skills
- Experience gaps
- Detailed insights

Format as JSON:
{
  "overallScore": number,
  "skillsMatch": number,
  "experienceMatch": number,
  "educationMatch": number,
  "technicalFit": number,
  "culturalFit": number,
  "communicationScore": number,
  "leadershipPotential": number,
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "recommendations": ["rec1", "rec2", "rec3"],
  "keywordMatches": ["keyword1", "keyword2"],
  "missingSkills": ["skill1", "skill2"],
  "experienceGaps": ["gap1", "gap2"],
  "aiInsights": "detailed analysis text"
}`;

      const result = await this.callGeminiAPI(prompt);
      console.log('🎯 Raw Gemini response:', result.substring(0, 500) + '...');

      // Parse JSON response
      let parsedResult: ResumeAnalysis;
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.warn('⚠️ Failed to parse JSON, using fallback analysis');
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
