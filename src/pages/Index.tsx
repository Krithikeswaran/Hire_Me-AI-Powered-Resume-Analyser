
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Brain, Users, ChevronRight, Download, Sparkles, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ResumeUpload from "@/components/ResumeUpload";
import JobDescriptionForm from "@/components/JobDescriptionForm";
import AgentProcessor from "@/components/AgentProcessor";
import ResultsDashboard from "@/components/ResultsDashboard";
import { systemIntegrationService } from "@/services/systemIntegrationService";

const Index = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [resumes, setResumes] = useState([]);
  const [jobDescription, setJobDescription] = useState(null);
  const [processingResults, setProcessingResults] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [systemStatus, setSystemStatus] = useState(null);

  // Load system status on component mount
  useEffect(() => {
    const loadSystemStatus = async () => {
      try {
        const status = systemIntegrationService.getSystemStatus();
        setSystemStatus(status);
      } catch (error) {
        console.error('Failed to load system status:', error);
      }
    };

    loadSystemStatus();
  }, []);

  const steps = [
    { id: 1, title: "Upload Resumes", icon: Upload },
    { id: 2, title: "Job Description", icon: FileText },
    { id: 3, title: "AI Processing", icon: Brain },
    { id: 4, title: "Results", icon: Users }
  ];

  const handleResumeUpload = (uploadedResumes) => {
    setResumes(uploadedResumes);
    toast({
      title: "Resumes Uploaded Successfully",
      description: `${uploadedResumes.length} resumes ready for processing.`,
    });
  };

  const handleJobDescriptionSubmit = (jd) => {
    setJobDescription(jd);
    setCurrentStep(3);
    toast({
      title: "Job Description Saved",
      description: "Ready to start AI analysis.",
    });
  };

  const handleProcessingComplete = (results) => {
    console.log('🎉 Processing complete! Results received:', results);
    console.log('🔍 Results type:', typeof results);
    console.log('🔍 Results keys:', results ? Object.keys(results) : 'No results');

    setProcessingResults(results);
    setCurrentStep(4);
    setIsProcessing(false);

    if (results && (results.individualAnalyses || results.topCandidates)) {
      toast({
        title: "Analysis Complete",
        description: "Top candidates identified successfully!",
      });
    } else {
      console.warn('⚠️ Results may be incomplete or invalid');
      toast({
        title: "Analysis Complete",
        description: "Analysis completed, but results may be limited.",
        variant: "destructive"
      });
    }
  };

  const resetProcess = () => {
    setCurrentStep(1);
    setResumes([]);
    setJobDescription(null);
    setProcessingResults(null);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Hire Me
                </h1>
                <p className="text-sm text-muted-foreground">Enhanced AI-Powered Resume Analyser</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* System Status Indicator */}
              {systemStatus && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant={systemStatus.geminiAvailable ? "default" : "secondary"}
                    className="gap-1"
                  >
                    {systemStatus.geminiAvailable ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    {systemStatus.recommendedWorkflow}
                  </Badge>
                </div>
              )}

              {processingResults && (
                <Button onClick={resetProcess} variant="outline" className="gap-2">
                  <Upload className="w-4 h-4" />
                  New Analysis
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex items-center">
                <div className={`
                  flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300
                  ${currentStep >= step.id 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                    : 'bg-white border-2 border-gray-200 text-gray-400'
                  }
                `}>
                  <step.icon className="w-5 h-5" />
                </div>
                <div className="ml-3 text-sm font-medium">
                  <div className={currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'}>
                    {step.title}
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className={`w-5 h-5 mx-4 ${
                  currentStep > step.id ? 'text-blue-600' : 'text-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {currentStep === 1 && (
            <ResumeUpload 
              onUpload={handleResumeUpload}
              onNext={() => resumes.length > 0 && setCurrentStep(2)}
              resumes={resumes}
            />
          )}

          {currentStep === 2 && (
            <JobDescriptionForm 
              onSubmit={handleJobDescriptionSubmit}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <AgentProcessor
              resumes={resumes}
              jobDescription={jobDescription}
              onComplete={handleProcessingComplete}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
            />
          )}

          {(() => {
            console.log('🔍 Render check - currentStep:', currentStep, 'processingResults:', !!processingResults);
            console.log('🔍 Should show results?', currentStep === 4 && processingResults);
            return currentStep === 4 && processingResults;
          })() && (
            <ResultsDashboard
              results={processingResults}
              jobDescription={jobDescription}
              onBack={() => setCurrentStep(3)}
            />
          )}

          {currentStep === 4 && !processingResults && (
            <div className="text-center p-8">
              <h2 className="text-xl font-bold text-red-600 mb-4">No Results Available</h2>
              <p className="text-gray-600 mb-4">Processing completed but no results were generated.</p>
              <Button onClick={() => setCurrentStep(1)} variant="outline">
                Start Over
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
