// Comprehensive system test for all enhanced features
import { systemIntegrationService } from '../services/systemIntegrationService';
import { simpleGeminiAnalyzer } from '../services/simpleGeminiService';
import { reportGenerationService } from '../services/reportGenerationService';

export interface SystemTestResult {
  success: boolean;
  testResults: {
    systemStatus: any;
    geminiIntegration: boolean;
    langgraphWorkflow: boolean;
    reportGeneration: boolean;
    batchProcessing: boolean;
    errorHandling: boolean;
  };
  performance: {
    totalTestTime: number;
    individualTestTimes: Record<string, number>;
  };
  errors: string[];
  recommendations: string[];
}

class SystemTestRunner {
  
  async runComprehensiveTest(): Promise<SystemTestResult> {
    const startTime = Date.now();
    const testResults: any = {};
    const individualTestTimes: Record<string, number> = {};
    const errors: string[] = [];
    const recommendations: string[] = [];
    
    console.log('🧪 Starting comprehensive system test...');
    
    try {
      // Test 1: System Status Check
      console.log('🔍 Test 1: System Status Check');
      const test1Start = Date.now();
      
      const systemStatus = systemIntegrationService.getSystemStatus();
      testResults.systemStatus = systemStatus.geminiAvailable && 
                                 systemStatus.langgraphReady && 
                                 systemStatus.reportGenerationReady;
      
      if (!systemStatus.geminiAvailable) {
        recommendations.push('Consider adding Gemini API key for enhanced analysis capabilities');
      }
      
      individualTestTimes['systemStatus'] = Date.now() - test1Start;
      console.log(`✅ System status check completed: ${testResults.systemStatus ? 'PASS' : 'PARTIAL'}`);
      
      // Test 2: Gemini Integration Test
      console.log('🔍 Test 2: Gemini Integration Test');
      const test2Start = Date.now();
      
      testResults.geminiIntegration = simpleGeminiAnalyzer.isAvailable();
      
      if (testResults.geminiIntegration) {
        try {
          // Test structured info extraction
          const testResume = `
            John Doe
            john.doe@email.com
            Software Developer with 3 years experience
            Skills: JavaScript, React, Node.js, Python
            Education: Bachelor's in Computer Science
            Projects: E-commerce website, Mobile app
          `;
          
          const testJobDescription = {
            jobTitle: 'Frontend Developer',
            department: 'Engineering',
            experienceLevel: 'Mid-level',
            minExperience: 2,
            maxExperience: 5,
            requiredSkills: ['JavaScript', 'React', 'CSS'],
            preferredSkills: ['Node.js', 'TypeScript'],
            education: 'Bachelor\'s degree',
            jobDescription: 'Frontend development role',
            responsibilities: ['UI development', 'Code review']
          };
          
          const analysis = await simpleGeminiAnalyzer.analyzeResume(testResume, testJobDescription, 'test-resume.txt');
          testResults.geminiIntegration = analysis.overallScore > 0;
          
        } catch (error) {
          console.warn('Gemini analysis test failed:', error);
          testResults.geminiIntegration = false;
          errors.push(`Gemini integration error: ${error.message}`);
        }
      }
      
      individualTestTimes['geminiIntegration'] = Date.now() - test2Start;
      console.log(`✅ Gemini integration test: ${testResults.geminiIntegration ? 'PASS' : 'FAIL'}`);
      
      // Test 3: LangGraph Workflow Test
      console.log('🔍 Test 3: LangGraph Workflow Test');
      const test3Start = Date.now();
      
      try {
        // Create a test file blob
        const testFileContent = 'Test resume content for workflow testing';
        const testFile = new File([testFileContent], 'test-workflow-resume.txt', { type: 'text/plain' });
        
        const testJobDescription = {
          jobTitle: 'Software Engineer',
          department: 'Engineering',
          experienceLevel: 'Entry Level',
          minExperience: 0,
          maxExperience: 2,
          requiredSkills: ['Programming', 'Problem Solving'],
          preferredSkills: ['JavaScript'],
          education: 'Bachelor\'s degree',
          jobDescription: 'Entry level software engineering role',
          responsibilities: ['Coding', 'Testing']
        };
        
        // Test single resume processing
        const singleResult = await systemIntegrationService.processSingleResume(testFile, testJobDescription);
        testResults.langgraphWorkflow = singleResult.analysis.overallScore >= 0;
        
      } catch (error) {
        console.warn('LangGraph workflow test failed:', error);
        testResults.langgraphWorkflow = false;
        errors.push(`LangGraph workflow error: ${error.message}`);
      }
      
      individualTestTimes['langgraphWorkflow'] = Date.now() - test3Start;
      console.log(`✅ LangGraph workflow test: ${testResults.langgraphWorkflow ? 'PASS' : 'FAIL'}`);
      
      // Test 4: Report Generation Test
      console.log('🔍 Test 4: Report Generation Test');
      const test4Start = Date.now();
      
      try {
        const testAnalysis = {
          overallScore: 85,
          skillsMatch: 90,
          experienceMatch: 80,
          educationMatch: 85,
          technicalFit: 88,
          culturalFit: 75,
          communicationScore: 80,
          leadershipPotential: 70,
          aiInsights: 'Test analysis for report generation',
          strengths: ['Strong technical skills', 'Good problem-solving'],
          weaknesses: ['Limited experience'],
          recommendations: ['Recommended for interview'],
          keywordMatches: ['JavaScript', 'React'],
          missingSkills: ['Node.js'],
          experienceGaps: ['Leadership experience'],
          candidateProfile: {
            fileName: 'test-candidate.pdf',
            personalInfo: {
              name: 'Test Candidate',
              email: 'test@example.com',
              phone: '+1234567890',
              location: 'Test City'
            },
            technicalSkills: {
              languages: ['JavaScript', 'Python'],
              frameworks: ['React', 'Express'],
              databases: ['MongoDB'],
              tools: ['Git', 'Docker'],
              cloud: ['AWS'],
              other: []
            },
            experience: [],
            education: [],
            projects: [],
            certifications: [],
            totalExperienceYears: 2,
            rawText: 'Test resume content'
          }
        };
        
        const testJobDescription = {
          jobTitle: 'Frontend Developer',
          department: 'Engineering',
          experienceLevel: 'Mid-level',
          minExperience: 2,
          maxExperience: 5,
          requiredSkills: ['JavaScript', 'React'],
          preferredSkills: ['Node.js'],
          education: 'Bachelor\'s degree',
          jobDescription: 'Frontend development role',
          responsibilities: ['UI development']
        };
        
        const detailedReport = reportGenerationService.generateCandidateReport(
          testAnalysis,
          testJobDescription,
          'test-candidate.pdf'
        );
        
        const htmlReport = reportGenerationService.generateHTMLReport(detailedReport);
        
        testResults.reportGeneration = detailedReport && htmlReport && htmlReport.length > 1000;
        
      } catch (error) {
        console.warn('Report generation test failed:', error);
        testResults.reportGeneration = false;
        errors.push(`Report generation error: ${error.message}`);
      }
      
      individualTestTimes['reportGeneration'] = Date.now() - test4Start;
      console.log(`✅ Report generation test: ${testResults.reportGeneration ? 'PASS' : 'FAIL'}`);
      
      // Test 5: Batch Processing Test
      console.log('🔍 Test 5: Batch Processing Test');
      const test5Start = Date.now();
      
      try {
        // Create test files
        const testFiles = [
          new File(['Test resume 1 content'], 'resume1.txt', { type: 'text/plain' }),
          new File(['Test resume 2 content'], 'resume2.txt', { type: 'text/plain' })
        ];
        
        const testJobDescription = {
          jobTitle: 'Software Developer',
          department: 'Engineering',
          experienceLevel: 'Entry Level',
          minExperience: 0,
          maxExperience: 3,
          requiredSkills: ['Programming'],
          preferredSkills: ['JavaScript'],
          education: 'Bachelor\'s degree',
          jobDescription: 'Software development role',
          responsibilities: ['Coding', 'Testing']
        };
        
        const batchResult = await systemIntegrationService.processMultipleResumes(
          testFiles,
          testJobDescription,
          { useEnhancedWorkflow: false } // Use faster processing for test
        );
        
        testResults.batchProcessing = batchResult.summary.totalCandidates === 2 &&
                                     batchResult.individualAnalyses.length === 2;
        
      } catch (error) {
        console.warn('Batch processing test failed:', error);
        testResults.batchProcessing = false;
        errors.push(`Batch processing error: ${error.message}`);
      }
      
      individualTestTimes['batchProcessing'] = Date.now() - test5Start;
      console.log(`✅ Batch processing test: ${testResults.batchProcessing ? 'PASS' : 'FAIL'}`);
      
      // Test 6: Error Handling Test
      console.log('🔍 Test 6: Error Handling Test');
      const test6Start = Date.now();
      
      try {
        // Test with invalid job description
        const invalidJobDescription = {};
        const validation = systemIntegrationService.validateJobDescription(invalidJobDescription);
        
        testResults.errorHandling = !validation.isValid && validation.issues.length > 0;
        
      } catch (error) {
        console.warn('Error handling test failed:', error);
        testResults.errorHandling = false;
        errors.push(`Error handling test error: ${error.message}`);
      }
      
      individualTestTimes['errorHandling'] = Date.now() - test6Start;
      console.log(`✅ Error handling test: ${testResults.errorHandling ? 'PASS' : 'FAIL'}`);
      
      // Calculate overall success
      const passedTests = Object.values(testResults).filter(result => result === true).length;
      const totalTests = Object.keys(testResults).length;
      const success = passedTests >= totalTests * 0.8; // 80% pass rate required
      
      const totalTestTime = Date.now() - startTime;
      
      console.log(`🎉 System test completed: ${passedTests}/${totalTests} tests passed`);
      
      // Generate recommendations
      if (!testResults.geminiIntegration) {
        recommendations.push('Set up Gemini API key for enhanced analysis capabilities');
      }
      
      if (!testResults.langgraphWorkflow) {
        recommendations.push('Check LangGraph dependencies and configuration');
      }
      
      if (totalTestTime > 30000) {
        recommendations.push('Consider optimizing system performance - tests took longer than expected');
      }
      
      return {
        success,
        testResults,
        performance: {
          totalTestTime,
          individualTestTimes
        },
        errors,
        recommendations
      };
      
    } catch (error) {
      console.error('❌ System test failed with critical error:', error);
      errors.push(`Critical system error: ${error.message}`);
      
      return {
        success: false,
        testResults,
        performance: {
          totalTestTime: Date.now() - startTime,
          individualTestTimes
        },
        errors,
        recommendations: ['System requires immediate attention - critical error occurred']
      };
    }
  }
  
  // Quick health check
  async quickHealthCheck(): Promise<boolean> {
    try {
      const status = systemIntegrationService.getSystemStatus();
      return status.langgraphReady && status.reportGenerationReady && status.batchProcessingReady;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const systemTestRunner = new SystemTestRunner();

// Make test runner available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).systemTestRunner = systemTestRunner;
}
