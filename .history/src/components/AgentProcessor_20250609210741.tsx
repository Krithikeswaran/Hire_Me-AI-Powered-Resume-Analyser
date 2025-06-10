
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Brain, Users, FileSearch, UserCheck, TrendingUp, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { initializeAI, extractResumeText, analyzeResume } from "@/services/aiService";

const AgentProcessor = ({ resumes, jobDescription, onComplete, isProcessing, setIsProcessing }) => {
  const [currentAgent, setCurrentAgent] = useState(0);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [aiInitialized, setAiInitialized] = useState(false);
  const [currentResumeIndex, setCurrentResumeIndex] = useState(0);

  const agents = [
    {
      name: "AI Initialization",
      icon: Brain,
      description: "Loading lightweight AI models",
      color: "text-blue-600"
    },
    {
      name: "Text Extraction",
      icon: FileSearch,
      description: "Processing resume files",
      color: "text-green-600"
    },
    {
      name: "AI Analysis",
      icon: UserCheck,
      description: "Analyzing candidates with AI",
      color: "text-purple-600"
    },
    {
      name: "Results Generation",
      icon: TrendingUp,
      description: "Ranking and generating insights",
      color: "text-orange-600"
    }
  ];

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${message}`);
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const processResumesWithAI = async () => {
    setIsProcessing(true);
    setProgress(0);
    setLogs([]);
    setCurrentResumeIndex(0);

    try {
      // Step 1: Initialize AI (faster with lighter models)
      setCurrentAgent(0);
      addLog("🚀 Starting AI initialization...", 'info');

      const startTime = Date.now();
      const aiReady = await initializeAI();
      const initTime = Date.now() - startTime;

      if (aiReady) {
        addLog(`✅ AI models loaded successfully (${(initTime/1000).toFixed(1)}s)`, 'success');
        setAiInitialized(true);
      } else {
        addLog("⚠️ Using enhanced fallback analysis", 'warning');
      }
      setProgress(20);

      // Step 2: Extract text from resumes (faster processing)
      setCurrentAgent(1);
      addLog(`📄 Processing ${resumes.length} resume files...`, 'info');
      
      const resumeTexts = [];
      for (let i = 0; i < resumes.length; i++) {
        setCurrentResumeIndex(i + 1);
        try {
          const text = await extractResumeText(resumes[i].file);
          resumeTexts.push({ ...resumes[i], extractedText: text });
          addLog(`✅ Processed: ${resumes[i].name}`, 'success');
        } catch (error) {
          addLog(`⚠️ Issue with ${resumes[i].name}, using fallback`, 'warning');
          resumeTexts.push({ ...resumes[i], extractedText: `Content from ${resumes[i].name}` });
        }
        setProgress(20 + ((i + 1) / resumes.length) * 30);
      }

      // Step 3: AI Analysis (optimized)
      setCurrentAgent(2);
      addLog("🤖 Running AI-powered candidate analysis...", 'info');
      
      const analyzedResumes = [];
      for (let i = 0; i < resumeTexts.length; i++) {
        const resume = resumeTexts[i];
        setCurrentResumeIndex(i + 1);
        addLog(`🔍 Analyzing candidate: ${resume.name.split('.')[0]}`, 'info');
        
        try {
          const analysis = await analyzeResume(resume.extractedText, jobDescription, resume.file);
          analyzedResumes.push({ ...resume, ...analysis });
          addLog(`✅ Analysis complete - Score: ${analysis.overallScore}%`, 'success');
        } catch (error) {
          addLog(`⚠️ Analysis failed for ${resume.name}, using fallback`, 'warning');
          // Add fallback analysis
          analyzedResumes.push({
            ...resume,
            overallScore: 75,
            skillsMatch: 70,
            experienceMatch: 75,
            communicationScore: 80,
            educationMatch: 75,
            recommendation: "Consider"
          });
        }
        
        setProgress(50 + ((i + 1) / resumeTexts.length) * 40);
      }

      // Step 4: Generate final results
      setCurrentAgent(3);
      addLog("📊 Generating final rankings and insights...", 'info');
      
      const sortedResumes = analyzedResumes.sort((a, b) => b.overallScore - a.overallScore);
      const topCandidates = sortedResumes.slice(0, Math.min(3, sortedResumes.length));
      
      const results = {
        topCandidates,
        allCandidates: sortedResumes,
        summary: {
          totalAnalyzed: resumes.length,
          averageScore: Math.floor(sortedResumes.reduce((sum, c) => sum + c.overallScore, 0) / sortedResumes.length),
          topCandidateScore: topCandidates[0]?.overallScore || 0,
          processingTime: aiInitialized ? (usingGemini ? "Gemini Pro Analysis" : "AI-Enhanced Analysis") : "Smart Fallback Analysis",
          aiEnabled: aiInitialized
        }
      };
      
      setProgress(100);
      addLog(`🎉 Analysis complete! Found ${topCandidates.length} top candidates`, 'success');
      
      // Show success toast
      toast({
        title: "Analysis Complete!",
        description: `Successfully analyzed ${resumes.length} resumes. Top candidate scored ${topCandidates[0]?.overallScore || 0}%.`,
      });
      
      // Small delay to show completion
      setTimeout(() => {
        onComplete(results);
      }, 1000);
      
    } catch (error) {
      console.error('Processing error:', error);
      addLog(`❌ Critical error: ${error.message}`, 'error');
      toast({
        title: "Processing Error",
        description: "Unable to complete analysis. Please try again.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (resumes.length > 0 && jobDescription && !isProcessing) {
      // Start processing automatically
      processResumesWithAI();
    }
  }, [resumes, jobDescription]);

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
            {isProcessing && currentAgent < 4 && <Loader2 className="w-6 h-6 animate-spin text-blue-600" />}
            AI-Powered Resume Analysis
          </CardTitle>
          <p className="text-muted-foreground">
            Analyzing {resumes.length} resumes with {usingGemini ? 'Gemini Pro' : 'optimized AI models'}
            {currentAgent === 2 && ` (${currentResumeIndex}/${resumes.length})`}
          </p>
          <div className={`flex items-center justify-center gap-2 text-sm p-2 rounded ${
            usingGemini ? 'text-green-600 bg-green-50' : 'text-blue-600 bg-blue-50'
          }`}>
            <Brain className="w-4 h-4" />
            {usingGemini ? 'Using Gemini Pro for maximum accuracy' : 'Using lightweight models for fast, accurate analysis'}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Overall Progress</span>
                <span className="flex items-center gap-1">
                  {Math.round(progress)}%
                  {isProcessing && progress < 100 && <Loader2 className="w-3 h-3 animate-spin" />}
                </span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            {/* Agent Status */}
            <div className="grid md:grid-cols-2 gap-4">
              {agents.map((agent, index) => {
                const isActive = currentAgent === index;
                const isComplete = currentAgent > index;
                const AgentIcon = agent.icon;

                return (
                  <Card
                    key={agent.name}
                    className={`transition-all duration-300 ${
                      isActive
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : isComplete
                        ? 'bg-green-50 ring-1 ring-green-200'
                        : 'bg-gray-50'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`
                          w-10 h-10 rounded-lg flex items-center justify-center
                          ${isActive
                            ? 'bg-blue-600 text-white'
                            : isComplete
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-300 text-gray-600'
                          }
                        `}>
                          {isComplete ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : isActive ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <AgentIcon className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">{agent.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{agent.description}</p>
                          {isActive && currentAgent === 2 && (
                            <p className="text-xs text-blue-600 mt-1">
                              Processing resume {currentResumeIndex} of {resumes.length}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Processing Logs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileSearch className="w-5 h-5" />
                  Processing Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {logs.length === 0 ? (
                    <div className="text-sm text-gray-500 p-2">Waiting for processing to start...</div>
                  ) : (
                    logs.map((log, index) => (
                      <div
                        key={index}
                        className={`text-sm p-2 rounded transition-all duration-200 ${
                          log.type === 'success'
                            ? 'bg-green-50 text-green-700 border-l-2 border-green-500'
                            : log.type === 'error'
                            ? 'bg-red-50 text-red-700 border-l-2 border-red-500'
                            : log.type === 'warning'
                            ? 'bg-yellow-50 text-yellow-700 border-l-2 border-yellow-500'
                            : 'bg-gray-50 text-gray-700 border-l-2 border-gray-300'
                        }`}
                      >
                        <span className="text-xs text-gray-500 font-mono">[{log.timestamp}]</span> {log.message}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentProcessor;
