import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, Zap, Globe, Shield, Star, Clock } from 'lucide-react';

export type AIModel = 'local' | 'openai' | 'gemini';

interface ModelOption {
  id: AIModel;
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  pros: string[];
  cons: string[];
  accuracy: number;
  speed: number;
  cost: 'Free' | 'Low' | 'Medium' | 'High';
  apiKeyRequired: boolean;
  badge?: string;
}

interface ModelSelectorProps {
  selectedModel: AIModel;
  onModelSelect: (model: AIModel) => void;
  className?: string;
}

const modelOptions: ModelOption[] = [
  {
    id: 'local',
    name: 'Local AI Models',
    description: 'Privacy-focused local processing with HuggingFace Transformers',
    icon: <Shield className="h-6 w-6" />,
    features: ['No API Key Required', 'Complete Privacy', 'Offline Processing', 'Fast Setup'],
    pros: ['100% Private', 'No API costs', 'Works offline', 'Fast initialization'],
    cons: ['Lower accuracy', 'Limited reasoning', 'Basic analysis'],
    accuracy: 70,
    speed: 85,
    cost: 'Free',
    apiKeyRequired: false,
    badge: 'Privacy First'
  },
  {
    id: 'openai',
    name: 'OpenAI GPT-4',
    description: 'Advanced reasoning with GPT-4 for comprehensive analysis',
    icon: <Brain className="h-6 w-6" />,
    features: ['Advanced Reasoning', 'Detailed Analysis', 'High Accuracy', 'Proven Performance'],
    pros: ['Excellent accuracy', 'Detailed insights', 'Strong reasoning', 'Reliable results'],
    cons: ['Requires API key', 'Higher cost', 'Internet required'],
    accuracy: 95,
    speed: 70,
    cost: 'High',
    apiKeyRequired: true,
    badge: 'Most Accurate'
  },
  {
    id: 'gemini',
    name: 'Google Gemini Pro',
    description: 'Google\'s latest AI with enhanced reasoning and cost efficiency',
    icon: <Star className="h-6 w-6" />,
    features: ['Latest AI Technology', 'Enhanced Reasoning', 'Cost Effective', 'Multimodal Analysis'],
    pros: ['Cutting-edge AI', 'Great accuracy', 'Cost efficient', 'Fast processing', 'Advanced reasoning'],
    cons: ['Requires API key', 'Internet required'],
    accuracy: 92,
    speed: 90,
    cost: 'Low',
    apiKeyRequired: true,
    badge: 'Recommended'
  }
];

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelSelect,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Choose Your AI Analysis Engine</h2>
        <p className="text-muted-foreground">
          Select the AI model that best fits your needs for resume analysis
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {modelOptions.map((option) => (
          <Card
            key={option.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedModel === option.id
                ? 'ring-2 ring-primary border-primary shadow-md'
                : 'hover:border-primary/50'
            }`}
            onClick={() => onModelSelect(option.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    selectedModel === option.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    {option.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{option.name}</CardTitle>
                    {option.badge && (
                      <Badge variant={option.id === 'gemini' ? 'default' : 'secondary'} className="mt-1">
                        {option.badge}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <CardDescription className="text-sm mt-2">
                {option.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Performance Metrics */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Accuracy</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${option.accuracy}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">{option.accuracy}%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Speed</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${option.speed}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">{option.speed}%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Cost</span>
                  <Badge variant={option.cost === 'Free' ? 'secondary' : 'outline'}>
                    {option.cost}
                  </Badge>
                </div>
              </div>

              {/* Features */}
              <div>
                <h4 className="text-sm font-medium mb-2">Key Features</h4>
                <div className="flex flex-wrap gap-1">
                  {option.features.map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* API Key Requirement */}
              {option.apiKeyRequired && (
                <div className="flex items-center space-x-2 text-sm text-amber-600 dark:text-amber-400">
                  <Globe className="h-4 w-4" />
                  <span>Requires API Key</span>
                </div>
              )}

              {/* Selection Button */}
              <Button
                variant={selectedModel === option.id ? 'default' : 'outline'}
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onModelSelect(option.id);
                }}
              >
                {selectedModel === option.id ? 'Selected' : 'Select Model'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Information */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <h3 className="font-semibold mb-2 flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          Quick Setup Guide
        </h3>
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Local Models:</strong> Ready to use immediately - no setup required!</p>
          <p><strong>OpenAI:</strong> Add your OpenAI API key to environment variables (REACT_APP_OPENAI_API_KEY)</p>
          <p><strong>Gemini:</strong> Add your Google AI API key to environment variables (REACT_APP_GEMINI_API_KEY)</p>
        </div>
      </div>
    </div>
  );
};

export default ModelSelector;
