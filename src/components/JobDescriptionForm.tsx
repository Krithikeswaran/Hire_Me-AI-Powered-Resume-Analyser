
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Briefcase, Star, Code, Award } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const JobDescriptionForm = ({ onSubmit, onBack }) => {
  const [formData, setFormData] = useState({
    jobTitle: '',
    department: '',
    experienceLevel: '',
    minExperience: '',
    maxExperience: '',
    requiredSkills: '',
    preferredSkills: '',
    education: '',
    jobDescription: '',
    responsibilities: '',
    companyInfo: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.jobTitle || !formData.requiredSkills || !formData.jobDescription) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    onSubmit(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Job Description Configuration
        </CardTitle>
        <p className="text-muted-foreground">
          Define the role requirements for accurate candidate matching
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle" className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Job Title *
              </Label>
              <Input
                id="jobTitle"
                placeholder="e.g., Senior Software Engineer"
                value={formData.jobTitle}
                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                placeholder="e.g., Engineering, Marketing"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
              />
            </div>
          </div>

          {/* Experience Level */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="experienceLevel">Experience Level</Label>
              <Select value={formData.experienceLevel} onValueChange={(value) => handleInputChange('experienceLevel', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entry Level</SelectItem>
                  <SelectItem value="mid">Mid Level</SelectItem>
                  <SelectItem value="senior">Senior Level</SelectItem>
                  <SelectItem value="lead">Lead/Principal</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="minExperience">Min Experience (years)</Label>
              <Input
                id="minExperience"
                type="number"
                min="0"
                placeholder="0"
                value={formData.minExperience}
                onChange={(e) => handleInputChange('minExperience', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxExperience">Max Experience (years)</Label>
              <Input
                id="maxExperience"
                type="number"
                min="0"
                placeholder="10"
                value={formData.maxExperience}
                onChange={(e) => handleInputChange('maxExperience', e.target.value)}
              />
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="requiredSkills" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                Required Skills *
              </Label>
              <Textarea
                id="requiredSkills"
                placeholder="e.g., JavaScript, React, Node.js, Python, SQL"
                value={formData.requiredSkills}
                onChange={(e) => handleInputChange('requiredSkills', e.target.value)}
                required
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredSkills" className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                Preferred Skills
              </Label>
              <Textarea
                id="preferredSkills"
                placeholder="e.g., AWS, Docker, GraphQL, TypeScript"
                value={formData.preferredSkills}
                onChange={(e) => handleInputChange('preferredSkills', e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Education */}
          <div className="space-y-2">
            <Label htmlFor="education" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Education Requirements
            </Label>
            <Select value={formData.education} onValueChange={(value) => handleInputChange('education', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select education requirement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high_school">High School</SelectItem>
                <SelectItem value="associate">Associate Degree</SelectItem>
                <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                <SelectItem value="master">Master's Degree</SelectItem>
                <SelectItem value="phd">PhD</SelectItem>
                <SelectItem value="bootcamp">Bootcamp/Certification</SelectItem>
                <SelectItem value="none">No Specific Requirement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Job Description */}
          <div className="space-y-2">
            <Label htmlFor="jobDescription">Job Description *</Label>
            <Textarea
              id="jobDescription"
              placeholder="Detailed description of the role, responsibilities, and what the ideal candidate looks like..."
              value={formData.jobDescription}
              onChange={(e) => handleInputChange('jobDescription', e.target.value)}
              required
              rows={4}
            />
          </div>

          {/* Key Responsibilities */}
          <div className="space-y-2">
            <Label htmlFor="responsibilities">Key Responsibilities</Label>
            <Textarea
              id="responsibilities"
              placeholder="List the main responsibilities and duties for this role..."
              value={formData.responsibilities}
              onChange={(e) => handleInputChange('responsibilities', e.target.value)}
              rows={3}
            />
          </div>

          {/* Company Information */}
          <div className="space-y-2">
            <Label htmlFor="companyInfo">Company Information</Label>
            <Textarea
              id="companyInfo"
              placeholder="Brief company description, culture, values..."
              value={formData.companyInfo}
              onChange={(e) => handleInputChange('companyInfo', e.target.value)}
              rows={2}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onBack}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Upload
            </Button>
            <Button 
              type="submit"
              className="flex-1 gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Start AI Analysis
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default JobDescriptionForm;
