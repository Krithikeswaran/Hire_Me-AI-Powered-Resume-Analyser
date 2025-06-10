
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Brain, Users, FileSearch, UserCheck, TrendingUp, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { initializeAI, analyzeBatchResumes } from "@/services/aiService";

const AgentProcessor = ({ resumes, jobDescription, onComplete, isProcessing, setIsProcessing }) => {
  const [currentAgent, setCurrentAgent] = useState(0);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [aiInitialized, setAiInitialized] = useState(false);
  const [currentResumeIndex, setCurrentResumeIndex] = useState(0);
  const [usingGemini, setUsingGemini] = useState(false);

  // Check if Gemini is available
  const hasGeminiKey = () => {
    return !!(import.meta.env.VITE_GEMINI_API_KEY &&
             import.meta.env.VITE_GEMINI_API_KEY !== 'your_gemini_api_key_here' &&
             import.meta.env.VITE_GEMINI_API_KEY.startsWith('AIzaSy'));
  };

  const agents = [
    {
      name: "AI Initialization",
      icon: Brain,
      description: hasGeminiKey() ? "Loading Gemini Pro for comparative analysis" : "Loading lightweight AI models",
      color: "text-blue-600"
    },
    {
      name: "File Preparation",
      icon: FileSearch,
      description: "Preparing resume files for batch processing",
      color: "text-green-600"
    },
    {
      name: "Batch Analysis",
      icon: UserCheck,
      description: hasGeminiKey() ? "Running Gemini Pro comparative analysis" : "Running enhanced AI batch analysis",
      color: "text-purple-600"
    },
    {
      name: "Comparative Ranking",
      icon: TrendingUp,
      description: "Generating intelligent rankings and insights",
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
      // Step 1: Initialize AI with Gemini detection
      setCurrentAgent(0);
      const geminiAvailable = hasGeminiKey();
      setUsingGemini(geminiAvailable);

      if (geminiAvailable) {
        addLog("🌟 Initializing Gemini Pro for comparative analysis...", 'info');
      } else {
        addLog("🚀 Starting local AI initialization...", 'info');
      }

      const startTime = Date.now();
      const aiReady = await initializeAI();
      const initTime = Date.now() - startTime;

      if (aiReady) {
        if (geminiAvailable) {
          addLog(`✅ Gemini Pro ready for comprehensive comparative analysis (${(initTime/1000).toFixed(1)}s)`, 'success');
        } else {
          addLog(`✅ Local AI models loaded successfully (${(initTime/1000).toFixed(1)}s)`, 'success');
        }
        setAiInitialized(true);
      } else {
        addLog("⚠️ Using enhanced fallback analysis", 'warning');
      }
      setProgress(20);

      // Step 2: Prepare resume files for batch processing
      setCurrentAgent(1);
      addLog(`📄 Preparing ${resumes.length} resume files for batch analysis...`, 'info');

      const resumeFiles = resumes.map(resume => resume.file);
      setProgress(40);
      addLog(`✅ All ${resumes.length} files prepared for processing`, 'success');

      // Step 3: Run comprehensive batch analysis
      setCurrentAgent(2);
      if (usingGemini) {
        addLog("🌟 Running Gemini Pro comparative batch analysis...", 'info');
        addLog("🔍 Extracting structured data from all resumes...", 'info');
        addLog("🏆 Performing intelligent comparative ranking...", 'info');
      } else {
        addLog("🤖 Running enhanced local batch analysis...", 'info');
      }

      setProgress(60);

      // Use the new batch analysis service
      const batchResults = await analyzeBatchResumes(resumeFiles, jobDescription);

      addLog(`✅ Batch analysis completed successfully!`, 'success');
      addLog(`📊 Processed ${batchResults.summary.totalCandidates} candidates`, 'info');
      addLog(`🎯 Average score: ${batchResults.summary.averageScore}%`, 'info');
      addLog(`⭐ Top score: ${batchResults.summary.topScore}%`, 'success');

      setProgress(90);

      // Step 4: Finalize results and rankings
      setCurrentAgent(3);
      addLog("📊 Finalizing comparative rankings and insights...", 'info');

      if (batchResults.comparativeRanking) {
        addLog(`🏆 Comparative ranking completed - ${batchResults.comparativeRanking.rankings.length} candidates ranked`, 'success');
        batchResults.comparativeRanking.rankings.slice(0, 3).forEach((ranking, index) => {
          addLog(`#${ranking.rank}: ${ranking.fileName} (${ranking.overallScore}%) - ${ranking.recommendation}`, 'info');
        });
      }

      setProgress(100);
      addLog(`🎉 Comprehensive analysis complete! Processed ${batchResults.summary.totalCandidates} candidates`, 'success');
      addLog(`⚡ Processing completed in ${batchResults.summary.processingTime}ms`, 'info');

      // Show success toast
      toast({
        title: "Comparative Analysis Complete!",
        description: `Successfully analyzed ${batchResults.summary.totalCandidates} resumes with ${usingGemini ? 'Gemini Pro' : 'AI models'}. ${batchResults.summary.recommendedCount} candidates recommended.`,
      });

      // Small delay to show completion
      setTimeout(() => {
        onComplete(batchResults);
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
            Comparative batch analysis of {resumes.length} resumes with {usingGemini ? 'Gemini Pro AI' : 'optimized AI models'}
          </p>
          <div className={`flex items-center justify-center gap-2 text-sm p-2 rounded ${
            usingGemini ? 'text-green-600 bg-green-50' : 'text-blue-600 bg-blue-50'
          }`}>
            <Brain className="w-4 h-4" />
            {usingGemini ? 'Using Gemini Pro for intelligent comparative ranking and comprehensive analysis' : 'Using enhanced local models for structured analysis and ranking'}
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
                              Running comprehensive batch analysis...
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
