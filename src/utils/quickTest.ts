// Quick test to verify the enhanced workflow works
import { enhancedLanggraphWorkflow } from '../services/enhancedLanggraphWorkflow';
import { simpleGeminiAnalyzer } from '../services/simpleGeminiService';
import { reportGenerationService } from '../services/reportGenerationService';

export async function runQuickTest(): Promise<boolean> {
  try {
    console.log('🧪 Running quick test of enhanced workflow...');
    
    // Create a test file
    const testContent = `
      John Doe
      john.doe@email.com
      +1234567890
      New York, NY
      
      EXPERIENCE:
      Software Developer at Tech Corp (2021-2023)
      - Developed web applications using React and Node.js
      - Worked with databases and APIs
      - Led a team of 3 developers
      
      EDUCATION:
      Bachelor of Science in Computer Science
      University of Technology (2017-2021)
      
      SKILLS:
      JavaScript, React, Node.js, Python, SQL, Git
      
      PROJECTS:
      E-commerce Website - Built using React and Express
      Mobile App - React Native application
    `;
    
    const testFile = new File([testContent], 'test-resume.txt', { type: 'text/plain' });
    
    const testJobDescription = {
      jobTitle: 'Frontend Developer',
      department: 'Engineering',
      experienceLevel: 'Mid-level',
      minExperience: 2,
      maxExperience: 5,
      requiredSkills: ['JavaScript', 'React', 'HTML', 'CSS'],
      preferredSkills: ['Node.js', 'TypeScript'],
      education: 'Bachelor\'s degree in Computer Science or related field',
      jobDescription: 'We are looking for a skilled Frontend Developer to join our team.',
      responsibilities: [
        'Develop user interfaces using React',
        'Collaborate with backend developers',
        'Optimize applications for performance'
      ]
    };
    
    console.log('📊 Testing enhanced workflow...');
    
    // Test the enhanced workflow
    const result = await enhancedLanggraphWorkflow.analyzeResume(testFile, testJobDescription);
    
    console.log('✅ Enhanced workflow test result:', {
      overallScore: result.overallScore,
      skillsMatch: result.skillsMatch,
      hasStrengths: result.strengths?.length > 0,
      hasRecommendations: result.recommendations?.length > 0,
      hasInsights: !!result.aiInsights
    });
    
    // Test report generation
    console.log('📄 Testing report generation...');
    const detailedReport = reportGenerationService.generateCandidateReport(
      result,
      testJobDescription,
      'test-resume.txt'
    );
    
    console.log('✅ Report generation test result:', {
      hasReport: !!detailedReport,
      candidateName: detailedReport.candidateInfo.name,
      overallScore: detailedReport.overallAssessment.overallScore,
      hasDetailedScores: !!detailedReport.detailedScores
    });
    
    // Test HTML report generation
    const htmlReport = reportGenerationService.generateHTMLReport(detailedReport);
    const htmlValid = htmlReport.includes('<!DOCTYPE html>') && htmlReport.includes('</html>');
    
    console.log('✅ HTML report test result:', {
      htmlGenerated: htmlValid,
      htmlLength: htmlReport.length
    });
    
    console.log('🎉 Quick test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Quick test failed:', error);
    return false;
  }
}

// Test basic Gemini analyzer as fallback
export async function testBasicAnalyzer(): Promise<boolean> {
  try {
    console.log('🧪 Testing basic analyzer fallback...');
    
    const testResume = `
      Jane Smith
      jane.smith@email.com
      Software Engineer with 3 years experience
      Skills: Python, Django, PostgreSQL, React
      Education: Master's in Computer Science
    `;
    
    const testJobDescription = {
      jobTitle: 'Backend Developer',
      department: 'Engineering',
      experienceLevel: 'Mid-level',
      minExperience: 2,
      maxExperience: 5,
      requiredSkills: ['Python', 'Django', 'SQL'],
      preferredSkills: ['React', 'AWS'],
      education: 'Bachelor\'s degree',
      jobDescription: 'Backend development role',
      responsibilities: ['API development', 'Database design']
    };
    
    const result = await simpleGeminiAnalyzer.analyzeResume(testResume, testJobDescription, 'test-basic.txt');
    
    console.log('✅ Basic analyzer test result:', {
      overallScore: result.overallScore,
      skillsMatch: result.skillsMatch,
      hasAnalysis: !!result.aiInsights
    });
    
    return result.overallScore > 0;
    
  } catch (error) {
    console.error('❌ Basic analyzer test failed:', error);
    return false;
  }
}

// Make tests available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).runQuickTest = runQuickTest;
  (window as any).testBasicAnalyzer = testBasicAnalyzer;
}
