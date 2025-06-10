
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
  CheckCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ResultsDashboard = ({ results, jobDescription, onBack }) => {
  const [selectedCandidate, setSelectedCandidate] = useState(0);

  // Handle both old and new result formats
  const isNewFormat = results.individualAnalyses && results.comparativeRanking;
  const candidates = isNewFormat
    ? results.individualAnalyses.sort((a, b) => b.overallScore - a.overallScore)
    : results.topCandidates || [];

  const summary = isNewFormat ? results.summary : results.summary;

  const downloadReport = () => {
    const reportData = {
      jobDescription,
      results,
      generatedAt: new Date().toISOString(),
      summary: summary,
      analysisType: isNewFormat ? 'Comparative Batch Analysis' : 'Individual Analysis',
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
      title: "Report Downloaded",
      description: "Analysis report has been downloaded successfully.",
    });
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
            <Button 
              onClick={downloadReport}
              variant="secondary"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Download Report
            </Button>
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
                      <h4 className="font-semibold">{candidate.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {candidate.recommendation}
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
                  <CardTitle className="text-xl">{candidate.name}</CardTitle>
                  <p className="text-muted-foreground mt-1">
                    Candidate #{selectedCandidate + 1} • {candidate.recommendation}
                  </p>
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
              {/* Score Breakdown */}
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
              {candidate.concerns.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    Areas for Clarification
                  </h4>
                  <div className="space-y-1">
                    {candidate.concerns.map((concern, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-yellow-700">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        {concern}
                      </div>
                    ))}
                  </div>
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
          onClick={downloadReport}
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
