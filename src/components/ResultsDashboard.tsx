
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Download,
  Crown,
  Star,
  TrendingUp,
  FileText,
  Mail,
  Phone,
  MapPin,
  ChevronLeft,
  Award,
  AlertTriangle,
  CheckCircle,
  Brain,
  Users
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { reportGenerationService } from "@/services/reportGenerationService";

const ResultsDashboard = ({ results, jobDescription, onBack }) => {
  const [selectedCandidate, setSelectedCandidate] = useState(0);

  // Debug logging
  console.log('🔍 ResultsDashboard received results:', results);
  console.log('🔍 ResultsDashboard received jobDescription:', jobDescription);

  // Safety check for results
  if (!results) {
    console.error('❌ No results provided to ResultsDashboard');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">No Results Available</h2>
              <p className="text-gray-600 mb-4">No analysis results were provided.</p>
              <Button onClick={onBack} variant="outline">
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Handle both old and new result formats
  const isNewFormat = results.individualAnalyses && results.comparativeRanking;
  console.log('🔍 Is new format:', isNewFormat);

  const candidates = isNewFormat
    ? results.individualAnalyses.sort((a, b) => b.overallScore - a.overallScore)
    : results.topCandidates || [];

  console.log('🔍 Candidates found:', candidates?.length || 0);

  if (!candidates || candidates.length === 0) {
    console.error('❌ No candidates found in results');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-yellow-600 mb-4">No Candidates Found</h2>
              <p className="text-gray-600 mb-4">No candidate data was found in the analysis results.</p>
              <Button onClick={onBack} variant="outline">
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const summary = isNewFormat ? results.summary : results.summary;

  // Download overall batch report
  const downloadBatchReport = () => {
    const reportData = {
      jobDescription,
      results,
      generatedAt: new Date().toISOString(),
      summary: summary,
      analysisType: isNewFormat ? 'Enhanced 4-Agent Batch Analysis' : 'Individual Analysis',
      comparativeRanking: isNewFormat ? results.comparativeRanking : null
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-resume-analysis-${jobDescription.jobTitle.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Batch Report Downloaded",
      description: "Complete batch analysis report has been downloaded successfully.",
    });
  };

  // Download individual candidate HTML report
  const downloadCandidateHTMLReport = (candidate) => {
    if (candidate.detailedReport) {
      reportGenerationService.downloadHTMLReport(candidate.detailedReport);
      toast({
        title: "Individual Report Downloaded",
        description: `Detailed HTML report for ${candidate.detailedReport.candidateInfo.name} has been downloaded.`,
      });
    } else {
      // Generate report on the fly if not available
      const detailedReport = reportGenerationService.generateCandidateReport(
        candidate,
        jobDescription,
        candidate.fileName
      );
      reportGenerationService.downloadHTMLReport(detailedReport);
      toast({
        title: "Individual Report Downloaded",
        description: `Detailed HTML report for ${candidate.fileName} has been downloaded.`,
      });
    }
  };

  // Download individual candidate JSON data
  const downloadCandidateJSONReport = (candidate) => {
    if (candidate.detailedReport) {
      reportGenerationService.downloadJSONReport(candidate.detailedReport);
      toast({
        title: "Individual Data Downloaded",
        description: `Detailed JSON data for ${candidate.detailedReport.candidateInfo.name} has been downloaded.`,
      });
    } else {
      // Generate report on the fly if not available
      const detailedReport = reportGenerationService.generateCandidateReport(
        candidate,
        jobDescription,
        candidate.fileName
      );
      reportGenerationService.downloadJSONReport(detailedReport);
      toast({
        title: "Individual Data Downloaded",
        description: `Detailed JSON data for ${candidate.fileName} has been downloaded.`,
      });
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBg = (score) => {
    if (score >= 90) return "bg-green-50 border-green-200";
    if (score >= 80) return "bg-blue-50 border-blue-200";
    if (score >= 70) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  const candidate = candidates[selectedCandidate];
  const totalAnalyzed = isNewFormat ? summary.totalCandidates : summary.totalAnalyzed;
  const averageScore = isNewFormat ? summary.averageScore : summary.averageScore;
  const topScore = isNewFormat ? summary.topScore : summary.topCandidateScore;
  const recommendedCount = isNewFormat ? summary.recommendedCount : 3;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <Crown className="w-8 h-8" />
                {isNewFormat ? 'Comparative Analysis Results' : `Top 3 Candidates`} for {jobDescription.jobTitle}
              </CardTitle>
              <p className="text-blue-100 mt-2">
                {isNewFormat ? 'AI-powered comparative ranking' : 'AI-powered analysis'} of {totalAnalyzed} candidates completed in {summary.processingTime}ms
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={downloadBatchReport}
                variant="secondary"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download Batch Report
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Analyzed</p>
                <p className="text-2xl font-bold">{totalAnalyzed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold">{averageScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Top Score</p>
                <p className="text-2xl font-bold">{topScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recommended</p>
                <p className="text-2xl font-bold">{recommendedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Candidate Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{isNewFormat ? 'Ranked Candidates' : 'Top Candidates'}</h3>
          {candidates.slice(0, Math.min(candidates.length, 5)).map((candidate, index) => (
            <Card
              key={candidate.id}
              className={`cursor-pointer transition-all duration-200 ${
                selectedCandidate === index
                  ? 'ring-2 ring-blue-500 bg-blue-50'
                  : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedCandidate(index)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-white font-bold
                      ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'}
                    `}>
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold">{candidate.fileName || candidate.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {candidate.recommendation || (candidate.overallScore >= 85 ? 'Highly Recommended' :
                         candidate.overallScore >= 75 ? 'Recommended' :
                         candidate.overallScore >= 65 ? 'Consider' : 'Not Recommended')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getScoreColor(candidate.overallScore)}`}>
                      {candidate.overallScore}%
                    </div>
                    <div className="text-xs text-muted-foreground">Overall Score</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Analysis */}
        <div className="lg:col-span-2 space-y-6">
          <Card className={`${getScoreBg(candidate.overallScore)} border-2`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{candidate.fileName || candidate.name}</CardTitle>
                  <p className="text-muted-foreground mt-1">
                    Candidate #{selectedCandidate + 1} • {candidate.recommendation || (candidate.overallScore >= 85 ? 'Highly Recommended' :
                     candidate.overallScore >= 75 ? 'Recommended' :
                     candidate.overallScore >= 65 ? 'Consider' : 'Not Recommended')}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={() => downloadCandidateHTMLReport(candidate)}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Download Report
                    </Button>
                    <Button
                      onClick={() => downloadCandidateJSONReport(candidate)}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download Data
                    </Button>
                  </div>
                </div>
                <Badge
                  variant={candidate.overallScore >= 90 ? "default" : "secondary"}
                  className="text-lg px-3 py-1"
                >
                  {candidate.overallScore}% Match
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Analysis Workflow Status */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">
                      Enhanced 4-Agent Analysis Complete
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600">
                      {summary?.analysisMethod || 'AI-Powered Analysis'}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-green-700">
                  Processed by: {summary?.agentsUsed?.join(' • ') || 'Skills Analyzer • Experience Evaluator • Education Assessor • Technical Fit Agent'}
                </div>
              </div>
              {/* 4-Agent Analysis Breakdown */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  4-Agent Analysis Breakdown
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Agent 1: Skills Analyzer */}
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Skills Analyzer</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {candidate.skillsMatch}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {candidate.keywordMatches?.length || 0} skills matched
                    </div>
                    <Progress value={candidate.skillsMatch} className="h-1 mt-2" />
                  </div>

                  {/* Agent 2: Experience Evaluator */}
                  <div className="bg-white rounded-lg p-3 border border-green-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Experience Evaluator</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {candidate.experienceMatch}%
                    </div>
                    <div className="text-xs text-gray-500">
                      Work & project analysis
                    </div>
                    <Progress value={candidate.experienceMatch} className="h-1 mt-2" />
                  </div>

                  {/* Agent 3: Education Assessor */}
                  <div className="bg-white rounded-lg p-3 border border-purple-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Education Assessor</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {candidate.educationMatch}%
                    </div>
                    <div className="text-xs text-gray-500">
                      Qualifications & background
                    </div>
                    <Progress value={candidate.educationMatch} className="h-1 mt-2" />
                  </div>

                  {/* Agent 4: Technical Fit */}
                  <div className="bg-white rounded-lg p-3 border border-orange-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Technical Fit Agent</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-600 mb-1">
                      {candidate.technicalFit}%
                    </div>
                    <div className="text-xs text-gray-500">
                      Technical capabilities
                    </div>
                    <Progress value={candidate.technicalFit} className="h-1 mt-2" />
                  </div>
                </div>

                {/* Analysis Method Indicator */}
                <div className="mt-3 text-center">
                  <Badge variant="outline" className="text-xs">
                    {candidate.detailedReport?.overallAssessment?.summary || 'Enhanced AI Analysis'}
                  </Badge>
                </div>
              </div>

              {/* Traditional Score Breakdown */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Skills Match</span>
                      <span className={getScoreColor(candidate.skillsMatch)}>
                        {candidate.skillsMatch}%
                      </span>
                    </div>
                    <Progress value={candidate.skillsMatch} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Experience Match</span>
                      <span className={getScoreColor(candidate.experienceMatch)}>
                        {candidate.experienceMatch}%
                      </span>
                    </div>
                    <Progress value={candidate.experienceMatch} className="h-2" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Technical Fit</span>
                      <span className={getScoreColor(candidate.technicalFit || candidate.communicationScore || 75)}>
                        {candidate.technicalFit || candidate.communicationScore || 75}%
                      </span>
                    </div>
                    <Progress value={candidate.technicalFit || candidate.communicationScore || 75} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Education Match</span>
                      <span className={getScoreColor(candidate.educationMatch)}>
                        {candidate.educationMatch}%
                      </span>
                    </div>
                    <Progress value={candidate.educationMatch} className="h-2" />
                  </div>
                </div>
              </div>

              {/* AI Insights */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  AI Insights
                </h4>
                <p className="text-blue-700 text-sm">{candidate.aiInsights}</p>
              </div>

              {/* Detailed Agent Analysis */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Detailed Agent Analysis
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Skills Analysis Details */}
                  <div className="bg-white rounded-lg p-3 border-l-4 border-blue-500">
                    <h5 className="font-medium text-blue-700 mb-2">🎯 Skills Analyzer Agent</h5>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Matched Skills:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {candidate.keywordMatches?.slice(0, 5).map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs bg-green-100 text-green-700">
                              {skill}
                            </Badge>
                          )) || <span className="text-gray-500">No specific matches found</span>}
                        </div>
                      </div>
                      {candidate.missingSkills?.length > 0 && (
                        <div>
                          <span className="font-medium">Missing Skills:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {candidate.missingSkills.slice(0, 3).map((skill, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs text-red-600 border-red-200">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Experience Analysis Details */}
                  <div className="bg-white rounded-lg p-3 border-l-4 border-green-500">
                    <h5 className="font-medium text-green-700 mb-2">💼 Experience Evaluator Agent</h5>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Experience Level:</span>
                        <span className="ml-2 text-gray-600">
                          {candidate.experienceMatch >= 80 ? 'Excellent match' :
                           candidate.experienceMatch >= 60 ? 'Good experience' :
                           'Entry level / Limited experience'}
                        </span>
                      </div>
                      {candidate.experienceGaps?.length > 0 && (
                        <div>
                          <span className="font-medium">Areas for Growth:</span>
                          <ul className="ml-4 mt-1 text-gray-600">
                            {candidate.experienceGaps.slice(0, 2).map((gap, idx) => (
                              <li key={idx} className="text-xs">• {gap}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Education Analysis Details */}
                  <div className="bg-white rounded-lg p-3 border-l-4 border-purple-500">
                    <h5 className="font-medium text-purple-700 mb-2">🎓 Education Assessor Agent</h5>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Education Fit:</span>
                        <span className="ml-2 text-gray-600">
                          {candidate.educationMatch >= 80 ? 'Highly relevant degree' :
                           candidate.educationMatch >= 60 ? 'Good educational background' :
                           'Basic qualifications met'}
                        </span>
                      </div>
                      {candidate.candidateProfile?.certifications?.length > 0 && (
                        <div>
                          <span className="font-medium">Certifications:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {candidate.candidateProfile.certifications.slice(0, 3).map((cert, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {cert}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Technical Fit Details */}
                  <div className="bg-white rounded-lg p-3 border-l-4 border-orange-500">
                    <h5 className="font-medium text-orange-700 mb-2">⚙️ Technical Fit Agent</h5>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Technical Capability:</span>
                        <span className="ml-2 text-gray-600">
                          {candidate.technicalFit >= 80 ? 'Strong technical skills' :
                           candidate.technicalFit >= 60 ? 'Good technical foundation' :
                           'Developing technical skills'}
                        </span>
                      </div>
                      {candidate.candidateProfile?.technicalSkills?.languages?.length > 0 && (
                        <div>
                          <span className="font-medium">Programming Languages:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {candidate.candidateProfile.technicalSkills.languages.slice(0, 4).map((lang, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                                {lang}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Strengths */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Key Strengths
                </h4>
                <div className="grid md:grid-cols-2 gap-2">
                  {candidate.strengths.map((strength, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      {strength}
                    </div>
                  ))}
                </div>
              </div>

              {/* Concerns */}
              {(candidate.concerns || candidate.weaknesses)?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    Areas for Clarification
                  </h4>
                  <div className="space-y-1">
                    {(candidate.concerns || candidate.weaknesses || []).map((concern, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-yellow-700">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        {concern}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show comparative ranking info if available */}
              {isNewFormat && results.comparativeRanking && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    Comparative Ranking
                  </h4>
                  <p className="text-purple-700 text-sm">
                    {results.comparativeRanking.summary}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4 border-t">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Processing
        </Button>
        <Button
          onClick={downloadBatchReport}
          className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          <Download className="w-4 h-4" />
          Download Full Report
        </Button>
      </div>
    </div>
  );
};

export default ResultsDashboard;
