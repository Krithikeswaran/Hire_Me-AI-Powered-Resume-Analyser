// System integration service to coordinate all enhanced components
import { simpleGeminiAnalyzer, JobDescription, ResumeAnalysis } from './simpleGeminiService';
import { enhancedLanggraphWorkflow } from './enhancedLanggraphWorkflow';
import { reportGenerationService, DetailedCandidateReport } from './reportGenerationService';
import { batchAnalysisService, BatchAnalysisResult } from './batchAnalysisService';

export interface SystemStatus {
  geminiAvailable: boolean;
  langgraphReady: boolean;
  reportGenerationReady: boolean;
  batchProcessingReady: boolean;
  recommendedWorkflow: string;
  capabilities: string[];
}

export interface ProcessingOptions {
  useEnhancedWorkflow: boolean;
  generateDetailedReports: boolean;
  enableComparativeRanking: boolean;
  maxConcurrentProcessing: number;
}

class SystemIntegrationService {
  
  // Check system status and capabilities
  getSystemStatus(): SystemStatus {
    const geminiAvailable = simpleGeminiAnalyzer.isAvailable();
    
    return {
      geminiAvailable,
      langgraphReady: true,
      reportGenerationReady: true,
      batchProcessingReady: true,
      recommendedWorkflow: geminiAvailable ? '4-Agent LangGraph with Gemini AI' : 'Enhanced Local Analysis',
      capabilities: [
        'Resume text extraction',
        'Structured information parsing',
        geminiAvailable ? 'Gemini AI-powered analysis' : 'Local AI analysis',
        '4-agent specialized evaluation',
        'Detailed HTML/JSON report generation',
        'Comparative candidate ranking',
        'Batch processing optimization',
        'Real-time progress tracking'
      ]
    };
  }

  // Get recommended processing options based on system capabilities
  getRecommendedOptions(): ProcessingOptions {
    const status = this.getSystemStatus();
    
    return {
      useEnhancedWorkflow: status.geminiAvailable,
      generateDetailedReports: true,
      enableComparativeRanking: status.geminiAvailable,
      maxConcurrentProcessing: status.geminiAvailable ? 3 : 5 // Gemini has rate limits
    };
  }

  // Process single resume with full enhancement
  async processSingleResume(
    resumeFile: File, 
    jobDescription: JobDescription,
    options?: Partial<ProcessingOptions>
  ): Promise<{
    analysis: ResumeAnalysis;
    detailedReport: DetailedCandidateReport;
    processingTime: number;
    method: string;
  }> {
    const startTime = Date.now();
    const opts = { ...this.getRecommendedOptions(), ...options };
    
    try {
      console.log(`🚀 Processing single resume: ${resumeFile.name}`);
      
      let analysis: ResumeAnalysis;
      let method: string;
      
      if (opts.useEnhancedWorkflow && simpleGeminiAnalyzer.isAvailable()) {
        console.log('🌟 Using enhanced 4-agent LangGraph workflow');
        analysis = await enhancedLanggraphWorkflow.analyzeResume(resumeFile, jobDescription);
        method = '4-Agent LangGraph with Gemini AI';
      } else {
        console.log('🤖 Using enhanced Gemini analysis');
        const resumeText = await this.extractResumeText(resumeFile);
        analysis = await simpleGeminiAnalyzer.analyzeResume(resumeText, jobDescription, resumeFile.name);
        method = 'Enhanced Gemini Analysis';
      }
      
      // Generate detailed report
      const detailedReport = reportGenerationService.generateCandidateReport(
        analysis,
        jobDescription,
        resumeFile.name
      );
      
      const processingTime = Date.now() - startTime;
      
      console.log(`✅ Single resume processing completed in ${processingTime}ms`);
      
      return {
        analysis,
        detailedReport,
        processingTime,
        method
      };
      
    } catch (error) {
      console.error('❌ Single resume processing failed:', error);
      throw error;
    }
  }

  // Process multiple resumes with full enhancement
  async processMultipleResumes(
    resumeFiles: File[],
    jobDescription: JobDescription,
    options?: Partial<ProcessingOptions>,
    progressCallback?: (progress: number, message: string) => void
  ): Promise<BatchAnalysisResult> {
    const opts = { ...this.getRecommendedOptions(), ...options };
    
    try {
      console.log(`🚀 Processing ${resumeFiles.length} resumes with enhanced workflow`);
      
      if (progressCallback) {
        progressCallback(10, 'Initializing enhanced processing workflow...');
      }
      
      // Use the enhanced batch analysis service
      const result = await batchAnalysisService.processBatch(resumeFiles, jobDescription);
      
      if (progressCallback) {
        progressCallback(100, 'Enhanced batch processing completed successfully!');
      }
      
      console.log(`✅ Batch processing completed: ${result.summary.totalCandidates} candidates analyzed`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Batch processing failed:', error);
      if (progressCallback) {
        progressCallback(0, `Processing failed: ${error.message}`);
      }
      throw error;
    }
  }

  // Validate job description for optimal processing
  validateJobDescription(jobDescription: any): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // Check required fields
    if (!jobDescription.jobTitle || jobDescription.jobTitle.trim().length === 0) {
      issues.push('Job title is required');
    }
    
    if (!jobDescription.requiredSkills || 
        (Array.isArray(jobDescription.requiredSkills) && jobDescription.requiredSkills.length === 0) ||
        (typeof jobDescription.requiredSkills === 'string' && jobDescription.requiredSkills.trim().length === 0)) {
      issues.push('Required skills must be specified');
    }
    
    // Check skill format
    if (jobDescription.requiredSkills) {
      if (typeof jobDescription.requiredSkills === 'string') {
        const skillCount = jobDescription.requiredSkills.split(/[,;\n]/).filter(s => s.trim().length > 0).length;
        if (skillCount < 3) {
          suggestions.push('Consider adding more specific required skills for better matching accuracy');
        }
      } else if (Array.isArray(jobDescription.requiredSkills) && jobDescription.requiredSkills.length < 3) {
        suggestions.push('Consider adding more specific required skills for better matching accuracy');
      }
    }
    
    // Check experience requirements
    if (!jobDescription.minExperience && !jobDescription.maxExperience) {
      suggestions.push('Specify experience requirements for more accurate candidate evaluation');
    }
    
    // Check education requirements
    if (!jobDescription.education) {
      suggestions.push('Specify education requirements for comprehensive evaluation');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }

  // Generate system performance report
  generatePerformanceReport(results: BatchAnalysisResult): {
    summary: string;
    metrics: {
      totalProcessed: number;
      averageProcessingTime: number;
      successRate: number;
      recommendationDistribution: Record<string, number>;
      topPerformingCandidates: string[];
    };
    recommendations: string[];
  } {
    const totalProcessed = results.summary.totalCandidates;
    const averageProcessingTime = results.summary.processingTime / totalProcessed;
    const successfulAnalyses = results.individualAnalyses.filter(a => a.overallScore > 0).length;
    const successRate = (successfulAnalyses / totalProcessed) * 100;
    
    // Calculate recommendation distribution
    const recommendationDistribution: Record<string, number> = {};
    results.individualAnalyses.forEach(analysis => {
      const recommendation = analysis.overallScore >= 85 ? 'Highly Recommended' :
                           analysis.overallScore >= 75 ? 'Recommended' :
                           analysis.overallScore >= 65 ? 'Consider' : 'Not Recommended';
      recommendationDistribution[recommendation] = (recommendationDistribution[recommendation] || 0) + 1;
    });
    
    // Get top performing candidates
    const topPerformingCandidates = results.individualAnalyses
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 3)
      .map(a => `${a.fileName} (${a.overallScore}%)`);
    
    const summary = `Processed ${totalProcessed} candidates using ${results.summary.analysisMethod}. ` +
                   `${results.summary.recommendedCount} candidates recommended with average score of ${results.summary.averageScore}%.`;
    
    const recommendations = [
      successRate < 90 ? 'Consider checking resume file formats for better processing success rate' : 'Excellent processing success rate',
      results.summary.averageScore < 70 ? 'Consider reviewing job requirements - they may be too specific' : 'Good candidate-job alignment',
      results.summary.recommendedCount === 0 ? 'No candidates met the criteria - consider broadening requirements' : 
      results.summary.recommendedCount > totalProcessed * 0.8 ? 'Many candidates qualified - consider raising standards' :
      'Good balance of qualified candidates found'
    ];
    
    return {
      summary,
      metrics: {
        totalProcessed,
        averageProcessingTime,
        successRate,
        recommendationDistribution,
        topPerformingCandidates
      },
      recommendations
    };
  }

  // Helper method to extract resume text
  private async extractResumeText(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string || '');
      };
      reader.readAsText(file);
    });
  }

  // Test system integration
  async runSystemTest(): Promise<{
    success: boolean;
    results: any;
    errors: string[];
  }> {
    const errors: string[] = [];
    const results: any = {};
    
    try {
      // Test 1: System status
      console.log('🧪 Testing system status...');
      results.systemStatus = this.getSystemStatus();
      
      // Test 2: Job description validation
      console.log('🧪 Testing job description validation...');
      const testJobDescription = {
        jobTitle: 'Software Developer',
        requiredSkills: ['JavaScript', 'React', 'Node.js'],
        minExperience: 2,
        maxExperience: 5,
        education: 'Bachelor\'s degree'
      };
      results.validation = this.validateJobDescription(testJobDescription);
      
      // Test 3: Report generation
      console.log('🧪 Testing report generation...');
      const testAnalysis = {
        overallScore: 85,
        skillsMatch: 90,
        experienceMatch: 80,
        educationMatch: 85,
        technicalFit: 88,
        culturalFit: 75,
        communicationScore: 80,
        leadershipPotential: 70,
        aiInsights: 'Test analysis completed successfully',
        strengths: ['Strong technical skills', 'Good experience'],
        weaknesses: ['Limited leadership experience'],
        recommendations: ['Recommended for interview'],
        keywordMatches: ['JavaScript', 'React'],
        missingSkills: ['Node.js'],
        experienceGaps: []
      };
      
      const testReport = reportGenerationService.generateCandidateReport(
        testAnalysis,
        testJobDescription,
        'test-resume.pdf'
      );
      results.reportGeneration = { success: true, reportGenerated: !!testReport };
      
      console.log('✅ System integration test completed successfully');
      
      return {
        success: true,
        results,
        errors
      };
      
    } catch (error) {
      console.error('❌ System integration test failed:', error);
      errors.push(error.message);
      
      return {
        success: false,
        results,
        errors
      };
    }
  }
}

// Export singleton instance
export const systemIntegrationService = new SystemIntegrationService();
