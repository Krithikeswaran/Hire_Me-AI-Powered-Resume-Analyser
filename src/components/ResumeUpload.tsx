
import React, { useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, File, X, FileText, Users, ChevronRight, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ResumeUpload = ({ onUpload, onNext, resumes }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const validFiles = files.filter(file => 
      file.type === 'application/pdf' || 
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword' ||
      file.type === 'text/plain' ||
      file.name.endsWith('.txt')
    );

    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid Files",
        description: "Only PDF, DOCX, and TXT files are supported for AI analysis.",
        variant: "destructive"
      });
    }

    if (validFiles.length > 0) {
      const resumeObjects = validFiles.map((file, index) => ({
        id: `resume_${Date.now()}_${index}`,
        name: file.name,
        size: file.size,
        file: file,
        uploadedAt: new Date()
      }));
      
      onUpload([...resumes, ...resumeObjects]);
      
      if (validFiles.length > 0) {
        toast({
          title: "Files Ready for AI Analysis",
          description: `${validFiles.length} resume(s) uploaded successfully and ready for AI processing.`,
        });
      }
    }
  };

  const removeResume = (id) => {
    const updatedResumes = resumes.filter(resume => resume.id !== id);
    onUpload(updatedResumes);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Upload Candidate Resumes
          </CardTitle>
          <p className="text-muted-foreground">
            Upload at least 3 resumes for AI-powered analysis (PDF, DOCX, or TXT format)
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded mt-2">
            <AlertCircle className="w-4 h-4" />
            AI models run locally in your browser - no data is sent to external servers
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={`
              border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
              ${dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Drop resumes here or click to browse
            </h3>
            <p className="text-gray-500 mb-4">
              Supports PDF, DOCX, and TXT files up to 10MB each
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <Button 
              variant="outline" 
              onClick={() => document.getElementById('file-upload').click()}
              className="gap-2"
            >
              <File className="w-4 h-4" />
              Choose Files
            </Button>
          </div>

          {resumes.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Uploaded Resumes ({resumes.length})
                </h4>
                <div className="text-sm text-muted-foreground">
                  {resumes.length >= 3 ? "Ready for AI analysis" : `Need ${3 - resumes.length} more`}
                </div>
              </div>
              
              <div className="grid gap-3 max-h-64 overflow-y-auto">
                {resumes.map((resume) => (
                  <div
                    key={resume.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-700 truncate max-w-xs">
                          {resume.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(resume.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeResume(resume.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resumes.length >= 3 && (
            <div className="mt-6 pt-4 border-t">
              <Button 
                onClick={onNext}
                className="w-full gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Users className="w-4 h-4" />
                Proceed to Job Description
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResumeUpload;
