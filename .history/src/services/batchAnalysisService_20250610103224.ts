// Batch analysis service for processing multiple resumes and comparative ranking
import { simpleGeminiAnalyzer, CandidateProfile, ResumeAnalysis, ComparativeRanking, JobDescription } from './simpleGeminiService';
import { extractResumeText } from './aiService';

export interface BatchAnalysisResult {
  individualAnalyses: (ResumeAnalysis & { fileName: string })[];
  comparativeRanking?: ComparativeRanking;
  summary: {
    totalCandidates: number;
    averageScore: number;
    topScore: number;
    recommendedCount: number;
    processingTime: number;
  };
}

class BatchAnalysisService {
  private candidateProfiles: CandidateProfile[] = [];
  private individualResults: (ResumeAnalysis & { fileName: string })[] = [];

  // Process multiple resumes and create comparative ranking
  async processBatch(resumeFiles: File[], jobDescription: JobDescription): Promise<BatchAnalysisResult> {
    const startTime = Date.now();
    console.log(`🚀 Starting batch analysis of ${resumeFiles.length} resumes...`);
    console.log('🔍 === BATCH JOB DESCRIPTION DEBUG ===');
    console.log('Job Title:', jobDescription.jobTitle);
    console.log('Required Skills (batch):', jobDescription.requiredSkills);
    console.log('Required Skills type (batch):', typeof jobDescription.requiredSkills);
    console.log('Required Skills length (batch):', Array.isArray(jobDescription.requiredSkills) ? jobDescription.requiredSkills.length : 'not array');
    console.log('=== END BATCH JOB DESCRIPTION DEBUG ===');

    // Clear previous data
    this.candidateProfiles = [];
    this.individualResults = [];
    simpleGeminiAnalyzer.clearCandidateProfiles();

    try {
      // Step 1: Process each resume individually
      console.log('📄 Step 1: Processing individual resumes...');
      for (let i = 0; i < resumeFiles.length; i++) {
        const file = resumeFiles[i];
        console.log(`Processing ${i + 1}/${resumeFiles.length}: ${file.name}`);

        try {
          // Extract text from resume
          const resumeText = await extractResumeText(file);
          
          // Create structured profile
          const profile = simpleGeminiAnalyzer.parseResumeToProfile(resumeText, file.name);
          this.candidateProfiles.push(profile);
          simpleGeminiAnalyzer.addCandidateProfile(profile);

          // Get individual analysis
          const analysis = await simpleGeminiAnalyzer.analyzeResume(resumeText, jobDescription, file.name);
          this.individualResults.push({
            ...analysis,
            fileName: file.name
          });

          console.log(`✅ Completed analysis for ${file.name}: ${analysis.overallScore}%`);
        } catch (error) {
          console.error(`❌ Failed to process ${file.name}:`, error);
          // Add fallback result
          this.individualResults.push({
            fileName: file.name,
            overallScore: 50,
            skillsMatch: 50,
            experienceMatch: 50,
            educationMatch: 50,
            technicalFit: 50,
            culturalFit: 50,
            communicationScore: 50,
            leadershipPotential: 50,
            aiInsights: `Failed to process ${file.name}`,
            strengths: ['Unable to analyze'],
            weaknesses: ['Processing failed'],
            recommendations: ['Manual review required'],
            keywordMatches: [],
            missingSkills: [],
            experienceGaps: []
          });
        }
      }

      // Step 2: Perform comparative ranking if Gemini is available
      let comparativeRanking: ComparativeRanking | undefined;
      if (simpleGeminiAnalyzer.isAvailable() && this.candidateProfiles.length > 1) {
        console.log('🏆 Step 2: Performing comparative ranking with Gemini...');
        try {
          comparativeRanking = await simpleGeminiAnalyzer.rankAllCandidates(jobDescription);
          console.log('✅ Comparative ranking completed');

          // Update individual results with ranking information
          this.updateResultsWithRanking(comparativeRanking);
        } catch (error) {
          console.warn('⚠️ Comparative ranking failed, using individual scores:', error);
          // Fallback: rank by individual scores
          comparativeRanking = this.createFallbackRanking();
        }
      } else {
        console.log('📊 Using fallback ranking based on individual scores...');
        comparativeRanking = this.createFallbackRanking();
      }

      // Step 3: Calculate summary statistics
      const summary = this.calculateSummary(startTime);

      console.log(`🎉 Batch analysis completed in ${summary.processingTime}ms`);
      console.log(`📊 Results: ${summary.recommendedCount}/${summary.totalCandidates} recommended, avg score: ${summary.averageScore}%`);

      return {
        individualAnalyses: this.individualResults,
        comparativeRanking,
        summary
      };

    } catch (error) {
      console.error('❌ Batch analysis failed:', error);
      throw error;
    }
  }

  // Update individual results with ranking information
  private updateResultsWithRanking(ranking: ComparativeRanking): void {
    ranking.rankings.forEach(rankInfo => {
      const result = this.individualResults.find(r => r.fileName === rankInfo.fileName);
      if (result) {
        // Update score based on ranking if significantly different
        if (Math.abs(result.overallScore - rankInfo.overallScore) > 10) {
          result.overallScore = rankInfo.overallScore;
        }
        
        // Add ranking insights to AI insights
        result.aiInsights += ` Comparative ranking: #${rankInfo.rank}. ${rankInfo.reasoning}`;
        
        // Update strengths and weaknesses with ranking insights
        result.strengths = [...new Set([...result.strengths, ...rankInfo.keyStrengths])];
        result.weaknesses = [...new Set([...result.weaknesses, ...rankInfo.keyWeaknesses])];
      }
    });
  }

  // Create fallback ranking based on individual scores
  private createFallbackRanking(): ComparativeRanking {
    const sortedResults = [...this.individualResults].sort((a, b) => b.overallScore - a.overallScore);
    
    const rankings = sortedResults.map((result, index) => ({
      fileName: result.fileName,
      rank: index + 1,
      overallScore: result.overallScore,
      reasoning: `Ranked #${index + 1} based on overall score of ${result.overallScore}%. ${result.aiInsights}`,
      keyStrengths: result.strengths.slice(0, 3),
      keyWeaknesses: result.weaknesses.slice(0, 2),
      recommendation: result.overallScore >= 85 ? 'Highly Recommended' as const :
                     result.overallScore >= 75 ? 'Recommended' as const :
                     result.overallScore >= 65 ? 'Consider' as const :
                     'Not Recommended' as const
    }));

    return {
      rankings,
      summary: `Ranked ${this.individualResults.length} candidates based on individual analysis scores. Top candidate: ${rankings[0]?.fileName} with ${rankings[0]?.overallScore}% match.`
    };
  }

  // Calculate summary statistics
  private calculateSummary(startTime: number) {
    const processingTime = Date.now() - startTime;
    const scores = this.individualResults.map(r => r.overallScore);
    const averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    const topScore = Math.max(...scores);
    const recommendedCount = this.individualResults.filter(r => r.overallScore >= 75).length;

    return {
      totalCandidates: this.individualResults.length,
      averageScore,
      topScore,
      recommendedCount,
      processingTime
    };
  }

  // Get candidate profiles for external use
  getCandidateProfiles(): CandidateProfile[] {
    return this.candidateProfiles;
  }

  // Get individual results for external use
  getIndividualResults(): (ResumeAnalysis & { fileName: string })[] {
    return this.individualResults;
  }
}

export const batchAnalysisService = new BatchAnalysisService();
