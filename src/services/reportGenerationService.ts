// Advanced report generation service for individual candidate reports
import { ResumeAnalysis, JobDescription, CandidateProfile } from './simpleGeminiService';

export interface DetailedCandidateReport {
  candidateInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    fileName: string;
  };
  jobInfo: {
    title: string;
    department: string;
    analysisDate: string;
  };
  overallAssessment: {
    overallScore: number;
    recommendation: string;
    fitLevel: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    summary: string;
  };
  detailedScores: {
    skillsMatch: { score: number; details: string; matchedSkills: string[]; missingSkills: string[] };
    experienceMatch: { score: number; details: string; relevantExperience: string[] };
    educationMatch: { score: number; details: string; qualifications: string[] };
    technicalFit: { score: number; details: string; technicalStrengths: string[] };
    communicationScore: { score: number; details: string };
    leadershipPotential: { score: number; details: string };
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  nextSteps: string[];
  charts: {
    scoreBreakdown: { label: string; value: number; color: string }[];
    skillsComparison: { skill: string; required: boolean; present: boolean }[];
  };
}

export class ReportGenerationService {
  
  // Generate comprehensive candidate report
  generateCandidateReport(
    analysis: ResumeAnalysis, 
    jobDescription: JobDescription, 
    fileName: string
  ): DetailedCandidateReport {
    
    const candidateProfile = analysis.candidateProfile;
    const analysisDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return {
      candidateInfo: {
        name: candidateProfile?.personalInfo?.name || 'Name not specified',
        email: candidateProfile?.personalInfo?.email || 'Email not provided',
        phone: candidateProfile?.personalInfo?.phone || 'Phone not provided',
        location: candidateProfile?.personalInfo?.location || 'Location not specified',
        fileName: fileName
      },
      
      jobInfo: {
        title: jobDescription.jobTitle,
        department: jobDescription.department || 'Not specified',
        analysisDate: analysisDate
      },
      
      overallAssessment: {
        overallScore: analysis.overallScore,
        recommendation: this.generateRecommendation(analysis.overallScore),
        fitLevel: this.determineFitLevel(analysis.overallScore),
        summary: this.generateExecutiveSummary(analysis, jobDescription)
      },
      
      detailedScores: {
        skillsMatch: {
          score: analysis.skillsMatch,
          details: this.generateSkillsDetails(analysis),
          matchedSkills: analysis.keywordMatches || [],
          missingSkills: analysis.missingSkills || []
        },
        experienceMatch: {
          score: analysis.experienceMatch,
          details: this.generateExperienceDetails(analysis, candidateProfile),
          relevantExperience: this.extractRelevantExperience(candidateProfile)
        },
        educationMatch: {
          score: analysis.educationMatch,
          details: this.generateEducationDetails(analysis, candidateProfile),
          qualifications: this.extractQualifications(candidateProfile)
        },
        technicalFit: {
          score: analysis.technicalFit,
          details: this.generateTechnicalDetails(analysis, candidateProfile),
          technicalStrengths: this.extractTechnicalStrengths(candidateProfile)
        },
        communicationScore: {
          score: analysis.communicationScore,
          details: this.generateCommunicationDetails(analysis.communicationScore)
        },
        leadershipPotential: {
          score: analysis.leadershipPotential,
          details: this.generateLeadershipDetails(analysis.leadershipPotential)
        }
      },
      
      strengths: analysis.strengths || [],
      weaknesses: analysis.weaknesses || [],
      recommendations: analysis.recommendations || [],
      nextSteps: this.generateNextSteps(analysis),
      
      charts: {
        scoreBreakdown: this.generateScoreBreakdownChart(analysis),
        skillsComparison: this.generateSkillsComparisonChart(analysis, jobDescription)
      }
    };
  }

  // Generate HTML report
  generateHTMLReport(report: DetailedCandidateReport): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resume Analysis Report - ${report.candidateInfo.name}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header p { margin: 5px 0; opacity: 0.9; }
        .content { padding: 30px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .score-card { background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 15px 0; border-radius: 5px; }
        .score-value { font-size: 2em; font-weight: bold; color: #667eea; }
        .score-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .score-item { background: white; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px; }
        .score-bar { background: #e0e0e0; height: 10px; border-radius: 5px; margin: 10px 0; }
        .score-fill { height: 100%; border-radius: 5px; transition: width 0.3s ease; }
        .excellent { background: #28a745; }
        .good { background: #17a2b8; }
        .fair { background: #ffc107; }
        .poor { background: #dc3545; }
        .list-item { background: #f8f9fa; margin: 5px 0; padding: 10px; border-radius: 5px; border-left: 3px solid #667eea; }
        .recommendation-box { background: #e7f3ff; border: 1px solid #b3d9ff; padding: 20px; border-radius: 8px; }
        .footer { text-align: center; padding: 20px; color: #666; border-top: 1px solid #e0e0e0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Resume Analysis Report</h1>
            <p><strong>Candidate:</strong> ${report.candidateInfo.name}</p>
            <p><strong>Position:</strong> ${report.jobInfo.title}</p>
            <p><strong>Analysis Date:</strong> ${report.jobInfo.analysisDate}</p>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>Executive Summary</h2>
                <div class="score-card">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div class="score-value">${report.overallAssessment.overallScore}%</div>
                            <div style="font-size: 1.2em; margin: 10px 0;"><strong>${report.overallAssessment.fitLevel} Fit</strong></div>
                            <div style="color: #666;">${report.overallAssessment.recommendation}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 1.1em; color: #333;">${report.overallAssessment.summary}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>Detailed Score Breakdown</h2>
                <div class="score-grid">
                    ${this.generateScoreItemHTML('Skills Match', report.detailedScores.skillsMatch)}
                    ${this.generateScoreItemHTML('Experience Match', report.detailedScores.experienceMatch)}
                    ${this.generateScoreItemHTML('Education Match', report.detailedScores.educationMatch)}
                    ${this.generateScoreItemHTML('Technical Fit', report.detailedScores.technicalFit)}
                    ${this.generateScoreItemHTML('Communication', report.detailedScores.communicationScore)}
                    ${this.generateScoreItemHTML('Leadership Potential', report.detailedScores.leadershipPotential)}
                </div>
            </div>

            <div class="section">
                <h2>Key Strengths</h2>
                ${report.strengths.map(strength => `<div class="list-item">✅ ${strength}</div>`).join('')}
            </div>

            <div class="section">
                <h2>Areas for Improvement</h2>
                ${report.weaknesses.map(weakness => `<div class="list-item">⚠️ ${weakness}</div>`).join('')}
            </div>

            <div class="section">
                <h2>Recommendations & Next Steps</h2>
                <div class="recommendation-box">
                    <h3>Recommendations:</h3>
                    ${report.recommendations.map(rec => `<div style="margin: 10px 0;">• ${rec}</div>`).join('')}
                    
                    <h3 style="margin-top: 20px;">Next Steps:</h3>
                    ${report.nextSteps.map(step => `<div style="margin: 10px 0;">• ${step}</div>`).join('')}
                </div>
            </div>

            <div class="section">
                <h2>Skills Analysis</h2>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <h3>Matched Skills (${report.detailedScores.skillsMatch.matchedSkills.length})</h3>
                        ${report.detailedScores.skillsMatch.matchedSkills.map(skill => 
                            `<div class="list-item" style="border-left-color: #28a745;">✅ ${skill}</div>`
                        ).join('')}
                    </div>
                    <div>
                        <h3>Missing Skills (${report.detailedScores.skillsMatch.missingSkills.length})</h3>
                        ${report.detailedScores.skillsMatch.missingSkills.map(skill => 
                            `<div class="list-item" style="border-left-color: #dc3545;">❌ ${skill}</div>`
                        ).join('')}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>Report generated by AI-Powered Resume Analyzer | ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>`;
  }

  // Generate PDF-ready content (for future PDF generation)
  generatePDFContent(report: DetailedCandidateReport): any {
    return {
      content: [
        { text: 'Resume Analysis Report', style: 'header' },
        { text: `Candidate: ${report.candidateInfo.name}`, style: 'subheader' },
        { text: `Position: ${report.jobInfo.title}`, style: 'subheader' },
        { text: `Analysis Date: ${report.jobInfo.analysisDate}`, style: 'subheader' },
        
        { text: 'Executive Summary', style: 'sectionHeader' },
        {
          table: {
            body: [
              ['Overall Score', `${report.overallAssessment.overallScore}%`],
              ['Fit Level', report.overallAssessment.fitLevel],
              ['Recommendation', report.overallAssessment.recommendation]
            ]
          }
        },
        
        { text: 'Detailed Scores', style: 'sectionHeader' },
        {
          table: {
            body: [
              ['Category', 'Score', 'Details'],
              ['Skills Match', `${report.detailedScores.skillsMatch.score}%`, report.detailedScores.skillsMatch.details],
              ['Experience Match', `${report.detailedScores.experienceMatch.score}%`, report.detailedScores.experienceMatch.details],
              ['Education Match', `${report.detailedScores.educationMatch.score}%`, report.detailedScores.educationMatch.details],
              ['Technical Fit', `${report.detailedScores.technicalFit.score}%`, report.detailedScores.technicalFit.details]
            ]
          }
        }
      ],
      styles: {
        header: { fontSize: 18, bold: true },
        subheader: { fontSize: 14, bold: true },
        sectionHeader: { fontSize: 16, bold: true, margin: [0, 20, 0, 10] }
      }
    };
  }

  // Download report as HTML file
  downloadHTMLReport(report: DetailedCandidateReport): void {
    const htmlContent = this.generateHTMLReport(report);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.candidateInfo.name.replace(/\s+/g, '_')}_Resume_Analysis_Report.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Download report as JSON
  downloadJSONReport(report: DetailedCandidateReport): void {
    const jsonContent = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.candidateInfo.name.replace(/\s+/g, '_')}_Resume_Analysis_Data.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Helper methods for report generation
  private generateRecommendation(overallScore: number): string {
    if (overallScore >= 85) return "Highly Recommended - Excellent candidate for the role";
    if (overallScore >= 75) return "Recommended - Strong candidate with good potential";
    if (overallScore >= 65) return "Consider - Decent candidate with some development needs";
    return "Not Recommended - Significant gaps in requirements";
  }

  private determineFitLevel(overallScore: number): 'Excellent' | 'Good' | 'Fair' | 'Poor' {
    if (overallScore >= 85) return 'Excellent';
    if (overallScore >= 75) return 'Good';
    if (overallScore >= 65) return 'Fair';
    return 'Poor';
  }

  private generateExecutiveSummary(analysis: ResumeAnalysis, jobDescription: JobDescription): string {
    const fitLevel = this.determineFitLevel(analysis.overallScore);
    const topStrength = analysis.strengths?.[0] || "relevant background";
    const mainConcern = analysis.weaknesses?.[0] || "some skill gaps";

    return `This candidate shows ${fitLevel.toLowerCase()} fit for the ${jobDescription.jobTitle} position. Key strength: ${topStrength}. Main consideration: ${mainConcern}.`;
  }

  private generateSkillsDetails(analysis: ResumeAnalysis): string {
    const matchedCount = analysis.keywordMatches?.length || 0;
    const missingCount = analysis.missingSkills?.length || 0;

    return `Matched ${matchedCount} required skills. ${missingCount > 0 ? `Missing ${missingCount} key skills.` : 'All key skills present.'}`;
  }

  private generateExperienceDetails(analysis: ResumeAnalysis, candidateProfile?: CandidateProfile): string {
    const experienceYears = candidateProfile?.totalExperienceYears || 0;
    const projectCount = candidateProfile?.projects?.length || 0;

    if (experienceYears > 0) {
      return `${experienceYears} years of relevant experience with ${projectCount} documented projects.`;
    } else {
      return `Entry-level candidate with ${projectCount} projects demonstrating practical skills.`;
    }
  }

  private generateEducationDetails(analysis: ResumeAnalysis, candidateProfile?: CandidateProfile): string {
    const educationCount = candidateProfile?.education?.length || 0;
    const certCount = candidateProfile?.certifications?.length || 0;

    return `${educationCount} educational qualification${educationCount !== 1 ? 's' : ''} with ${certCount} professional certification${certCount !== 1 ? 's' : ''}.`;
  }

  private generateTechnicalDetails(analysis: ResumeAnalysis, candidateProfile?: CandidateProfile): string {
    const skills = candidateProfile?.technicalSkills;
    const totalSkills = skills ? Object.values(skills).flat().length : 0;

    return `Demonstrates proficiency in ${totalSkills} technical skills across multiple domains.`;
  }

  private generateCommunicationDetails(score: number): string {
    if (score >= 80) return "Resume demonstrates clear communication and professional presentation.";
    if (score >= 70) return "Good communication skills evident in resume structure and content.";
    return "Resume could benefit from improved clarity and organization.";
  }

  private generateLeadershipDetails(score: number): string {
    if (score >= 80) return "Strong indicators of leadership potential and initiative.";
    if (score >= 70) return "Some leadership experience or potential demonstrated.";
    return "Limited leadership experience evident in current background.";
  }

  private extractRelevantExperience(candidateProfile?: CandidateProfile): string[] {
    return candidateProfile?.experience?.map(exp => `${exp.title} at ${exp.company}`) || [];
  }

  private extractQualifications(candidateProfile?: CandidateProfile): string[] {
    const qualifications = [];

    candidateProfile?.education?.forEach(edu => {
      qualifications.push(`${edu.degree} in ${edu.field}`);
    });

    candidateProfile?.certifications?.forEach(cert => {
      qualifications.push(cert);
    });

    return qualifications;
  }

  private extractTechnicalStrengths(candidateProfile?: CandidateProfile): string[] {
    const strengths = [];
    const skills = candidateProfile?.technicalSkills;

    if (skills?.languages?.length > 0) {
      strengths.push(`Programming: ${skills.languages.slice(0, 3).join(', ')}`);
    }

    if (skills?.frameworks?.length > 0) {
      strengths.push(`Frameworks: ${skills.frameworks.slice(0, 3).join(', ')}`);
    }

    if (skills?.databases?.length > 0) {
      strengths.push(`Databases: ${skills.databases.slice(0, 3).join(', ')}`);
    }

    return strengths;
  }

  private generateNextSteps(analysis: ResumeAnalysis): string[] {
    const steps = [];

    if (analysis.overallScore >= 75) {
      steps.push("Schedule technical interview to assess practical skills");
      steps.push("Conduct behavioral interview to evaluate cultural fit");
    } else if (analysis.overallScore >= 65) {
      steps.push("Consider for phone screening to clarify experience");
      steps.push("Assess willingness to develop missing skills");
    } else {
      steps.push("Provide feedback on areas for improvement");
      steps.push("Consider for future opportunities after skill development");
    }

    if (analysis.missingSkills?.length > 0) {
      steps.push(`Evaluate proficiency in: ${analysis.missingSkills.slice(0, 2).join(', ')}`);
    }

    return steps;
  }

  private generateScoreBreakdownChart(analysis: ResumeAnalysis): { label: string; value: number; color: string }[] {
    return [
      { label: 'Skills Match', value: analysis.skillsMatch, color: '#667eea' },
      { label: 'Experience', value: analysis.experienceMatch, color: '#764ba2' },
      { label: 'Education', value: analysis.educationMatch, color: '#f093fb' },
      { label: 'Technical Fit', value: analysis.technicalFit, color: '#4facfe' },
      { label: 'Communication', value: analysis.communicationScore, color: '#43e97b' },
      { label: 'Leadership', value: analysis.leadershipPotential, color: '#38f9d7' }
    ];
  }

  private generateSkillsComparisonChart(analysis: ResumeAnalysis, jobDescription: JobDescription): { skill: string; required: boolean; present: boolean }[] {
    const requiredSkills = Array.isArray(jobDescription.requiredSkills)
      ? jobDescription.requiredSkills
      : [jobDescription.requiredSkills];

    const matchedSkills = analysis.keywordMatches || [];

    return requiredSkills.map(skill => ({
      skill,
      required: true,
      present: matchedSkills.includes(skill)
    }));
  }

  private generateScoreItemHTML(title: string, scoreData: any): string {
    const score = scoreData.score;
    const colorClass = score >= 80 ? 'excellent' : score >= 70 ? 'good' : score >= 60 ? 'fair' : 'poor';

    return `
      <div class="score-item">
        <h3>${title}</h3>
        <div class="score-value" style="color: ${this.getScoreColor(score)}">${score}%</div>
        <div class="score-bar">
          <div class="score-fill ${colorClass}" style="width: ${score}%"></div>
        </div>
        <p style="margin: 10px 0; color: #666;">${scoreData.details}</p>
      </div>
    `;
  }

  private getScoreColor(score: number): string {
    if (score >= 80) return '#28a745';
    if (score >= 70) return '#17a2b8';
    if (score >= 60) return '#ffc107';
    return '#dc3545';
  }
}

// Export singleton instance
export const reportGenerationService = new ReportGenerationService();
