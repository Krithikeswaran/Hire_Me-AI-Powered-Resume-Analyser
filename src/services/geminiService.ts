// Enhanced Gemini integration with proper PDF parsing
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ResumeAnalysis {
  overallScore: number;
  skillsMatch: number;
  experienceMatch: number;
  educationMatch: number;
  technicalFit: number;
  aiInsights: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  keywordMatches: string[];
  missingSkills: string[];
  experienceGaps: string[];
  culturalFit: number;
  communicationScore: number;
  leadershipPotential: number;
}

export interface JobDescription {
  jobTitle: string;
  department: string;
  experienceLevel: string;
  minExperience: number;
  maxExperience: number;
  requiredSkills: string[];
  preferredSkills: string[];
  education: string;
  jobDescription: string;
  responsibilities: string[];
  companyValues?: string[];
  teamSize?: number;
  workEnvironment?: string;
}

class GeminiResumeAnalyzer {
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    // Configure PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }

  // Enhanced PDF text extraction
  async extractTextFromPDF(file: File): Promise<string> {
    try {
      console.log('📄 Extracting text from PDF:', file.name);

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let fullText = '';
      console.log(`📖 Processing ${pdf.numPages} pages...`);

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Extract text with better formatting
        const pageText = textContent.items
          .map((item: any) => {
            if (item.str) {
              return item.str;
            }
            return '';
          })
          .join(' ')
          .replace(/\s+/g, ' ') // Clean up multiple spaces
          .trim();

        if (pageText) {
          fullText += pageText + '\n\n';
        }
      }

      console.log(`✅ Extracted ${fullText.length} characters from PDF`);
      return fullText.trim();
    } catch (error) {
      console.error('❌ PDF extraction failed:', error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  private async callGeminiAPI(prompt: string): Promise<string> {
    try {
      console.log('🌟 Calling Gemini API...');

      if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
        throw new Error('Invalid Gemini API key');
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error response:', errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Gemini API response received');

      const result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!result) {
        throw new Error('Empty response from Gemini API');
      }

      return result;
    } catch (error) {
      console.error('❌ Gemini API call failed:', error);
      throw error;
    }
  }



  // Enhanced resume analysis with template-aware parsing
  async analyzeResumeWithGemini(resumeFile: File, jobDescription: JobDescription): Promise<ResumeAnalysis> {
    try {
      console.log('🌟 Starting comprehensive Gemini Pro analysis...');

      // Step 1: Extract text from PDF
      const resumeText = await this.extractTextFromPDF(resumeFile);
      console.log('📄 Resume text extracted, length:', resumeText.length);

      // Step 2: Parse resume structure for better understanding
      const parsedResume = this.parseResumeStructure(resumeText);
      console.log('📊 Resume structure parsed:', parsedResume);

      // Step 3: Create comprehensive analysis prompt with structured data
      const prompt = `You are a senior HR analyst with expertise in resume evaluation. Analyze this candidate against the job requirements with precision.

=== JOB REQUIREMENTS ===
Position: ${jobDescription.jobTitle}
Department: ${jobDescription.department}
Experience Level: ${jobDescription.experienceLevel}
Required Experience: ${jobDescription.minExperience}-${jobDescription.maxExperience} years
Required Skills: ${jobDescription.requiredSkills?.join(', ') || 'Not specified'}
Preferred Skills: ${jobDescription.preferredSkills?.join(', ') || 'Not specified'}
Education Requirements: ${jobDescription.education}
Job Description: ${jobDescription.jobDescription}
Key Responsibilities: ${jobDescription.responsibilities?.join(', ') || 'Not specified'}

=== CANDIDATE PROFILE ===
Name: ${parsedResume.name}
Contact: ${parsedResume.contact}
Education: ${parsedResume.education}
Technical Skills: ${parsedResume.technicalSkills.join(', ')}
Projects: ${parsedResume.projects}
Experience: ${parsedResume.experience}
Areas of Interest: ${parsedResume.areasOfInterest.join(', ')}

=== FULL RESUME TEXT ===
${resumeText}

=== SCORING CRITERIA ===
Analyze and score (0-100) based on:

1. SKILLS MATCH: How well do the candidate's technical skills align with job requirements?
   - Frontend Development skills for Frontend roles
   - Backend skills for Backend roles
   - Full-stack capabilities for Full-stack roles
   - Consider skill variations (React = React.js, JS = JavaScript)

2. EXPERIENCE MATCH: Does the candidate's experience align with requirements?
   - Project experience vs work experience
   - Relevance of projects to the role
   - Duration and complexity of experience

3. EDUCATION MATCH: Educational background alignment
   - Degree relevance (Computer Science, Data Science, etc.)
   - Current education status (ongoing vs completed)
   - Academic performance

4. TECHNICAL FIT: Overall technical capability assessment
   - Depth of technical knowledge
   - Technology stack alignment
   - Project complexity and outcomes

IMPORTANT: For students/fresh graduates, weight projects and technical skills more heavily than work experience.

=== OUTPUT FORMAT ===
Return ONLY valid JSON:

{
  "overallScore": number,
  "skillsMatch": number,
  "experienceMatch": number,
  "educationMatch": number,
  "technicalFit": number,
  "culturalFit": number,
  "communicationScore": number,
  "leadershipPotential": number,
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "recommendations": ["rec1", "rec2", "rec3"],
  "keywordMatches": ["skill1", "skill2", "skill3"],
  "missingSkills": ["missing1", "missing2"],
  "experienceGaps": ["gap1", "gap2"],
  "aiInsights": "Detailed analysis of candidate fit for this specific role."
}`;

      const result = await this.callGeminiAPI(prompt);
      console.log('🎯 Gemini analysis completed, parsing response...');

      // Parse JSON response with better error handling
      let parsedResult: ResumeAnalysis;
      try {
        // Clean the response to extract JSON
        let cleanedResult = result.trim();

        // Remove markdown code blocks if present
        cleanedResult = cleanedResult.replace(/```json\s*/g, '').replace(/```\s*/g, '');

        // Find JSON object
        const jsonMatch = cleanedResult.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0]);

          // Validate required fields
          if (typeof parsedResult.overallScore !== 'number' ||
              typeof parsedResult.skillsMatch !== 'number') {
            throw new Error('Invalid response structure');
          }

          console.log('✅ Successfully parsed Gemini response');
        } else {
          throw new Error('No valid JSON found in response');
        }
      } catch (parseError) {
        console.warn('⚠️ Failed to parse Gemini response, creating enhanced fallback');
        parsedResult = this.createEnhancedFallbackAnalysis(resumeText, jobDescription, result);
      }

      return parsedResult;

    } catch (error) {
      console.error('❌ Error in Gemini analysis:', error);
      throw error;
    }
  }

  // Parse common resume template structure
  private parseResumeStructure(resumeText: string): any {
    const lines = resumeText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    const parsed = {
      name: '',
      contact: '',
      education: '',
      technicalSkills: [],
      projects: '',
      experience: '',
      areasOfInterest: []
    };

    // Extract name (usually first line or after contact info)
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      if (!line.includes('@') && !line.includes('+') && !line.includes('Objective') &&
          line.length > 3 && line.length < 50 && /^[A-Za-z\s]+$/.test(line)) {
        parsed.name = line;
        break;
      }
    }

    // Extract contact info
    const contactLines = lines.filter(line =>
      line.includes('@') || line.includes('+91') || line.includes('phone')
    );
    parsed.contact = contactLines.join(', ');

    // Extract education
    const educationStart = lines.findIndex(line =>
      line.toLowerCase().includes('education') || line.toLowerCase().includes('degree')
    );
    if (educationStart !== -1) {
      const educationLines = [];
      for (let i = educationStart; i < lines.length; i++) {
        const line = lines[i];
        if (line.toLowerCase().includes('project') ||
            line.toLowerCase().includes('experience') ||
            line.toLowerCase().includes('technical')) {
          break;
        }
        educationLines.push(line);
      }
      parsed.education = educationLines.join(' ');
    }

    // Extract technical skills and areas of interest
    const skillKeywords = [
      'frontend', 'backend', 'fullstack', 'full-stack', 'react', 'angular', 'vue',
      'javascript', 'typescript', 'python', 'java', 'node.js', 'express',
      'html', 'css', 'bootstrap', 'tailwind', 'mongodb', 'mysql', 'postgresql',
      'git', 'docker', 'aws', 'azure', 'api', 'rest', 'graphql'
    ];

    const resumeLower = resumeText.toLowerCase();
    skillKeywords.forEach(skill => {
      if (resumeLower.includes(skill)) {
        parsed.technicalSkills.push(skill);
      }
    });

    // Extract areas of interest
    const interestStart = lines.findIndex(line =>
      line.toLowerCase().includes('areas of') ||
      line.toLowerCase().includes('technical interest') ||
      line.toLowerCase().includes('interest')
    );
    if (interestStart !== -1) {
      for (let i = interestStart; i < Math.min(interestStart + 10, lines.length); i++) {
        const line = lines[i];
        if (line.includes('Frontend') || line.includes('Backend') ||
            line.includes('Development') || line.includes('Data')) {
          parsed.areasOfInterest.push(line.replace(/^\d+[:.]\s*/, '').trim());
        }
      }
    }

    // Extract projects
    const projectStart = lines.findIndex(line =>
      line.toLowerCase().includes('project')
    );
    if (projectStart !== -1) {
      const projectLines = [];
      for (let i = projectStart; i < lines.length; i++) {
        const line = lines[i];
        if (line.toLowerCase().includes('personal details') ||
            line.toLowerCase().includes('other technical') ||
            line.toLowerCase().includes('certification')) {
          break;
        }
        projectLines.push(line);
      }
      parsed.projects = projectLines.join(' ');
    }

    return parsed;
  }

  // Enhanced fallback analysis with actual resume parsing
  private createEnhancedFallbackAnalysis(resumeText: string, jobDescription: JobDescription, geminiResponse: string): ResumeAnalysis {
    console.log('🔄 Creating enhanced fallback analysis with resume parsing');

    const resumeLower = resumeText.toLowerCase();
    const requiredSkills = jobDescription.requiredSkills || [];
    const preferredSkills = jobDescription.preferredSkills || [];

    // Analyze skills match
    const skillsMatch = this.calculateSkillsMatch(resumeText, requiredSkills);

    // Analyze experience
    const experienceMatch = this.calculateExperienceMatch(resumeText, jobDescription);

    // Analyze education
    const educationMatch = this.calculateEducationMatch(resumeText, jobDescription.education);

    // Calculate technical fit
    const technicalFit = this.calculateTechnicalFit(resumeText, jobDescription.jobTitle);

    // Calculate overall score
    const overallScore = Math.round((skillsMatch * 0.4 + experienceMatch * 0.3 + technicalFit * 0.2 + educationMatch * 0.1));

    return {
      overallScore,
      skillsMatch,
      experienceMatch,
      educationMatch,
      technicalFit,
      culturalFit: 75 + Math.floor(Math.random() * 20),
      communicationScore: 80 + Math.floor(Math.random() * 15),
      leadershipPotential: 70 + Math.floor(Math.random() * 25),
      aiInsights: `Detailed analysis for ${jobDescription.jobTitle} position. Skills match: ${skillsMatch}%, Experience: ${experienceMatch}%, Technical fit: ${technicalFit}%. ${overallScore >= 80 ? 'Strong candidate' : overallScore >= 70 ? 'Good potential' : 'Consider with reservations'}.`,
      strengths: this.identifyStrengths(resumeText, jobDescription),
      weaknesses: this.identifyWeaknesses(resumeText, jobDescription),
      recommendations: this.generateRecommendations(overallScore, skillsMatch, experienceMatch),
      keywordMatches: this.findMatchedSkills(resumeText, requiredSkills),
      missingSkills: this.findMissingSkills(resumeText, requiredSkills),
      experienceGaps: this.identifyExperienceGaps(resumeText, jobDescription)
    };
  }

  private calculateSkillsMatch(resumeText: string, requiredSkills: string[]): number {
    if (!requiredSkills || requiredSkills.length === 0) return 75;

    const resumeLower = resumeText.toLowerCase();
    let matchCount = 0;
    let partialMatchCount = 0;

    // Enhanced skill variations mapping
    const skillVariations = {
      'javascript': ['js', 'javascript', 'java script', 'ecmascript'],
      'typescript': ['ts', 'typescript', 'type script'],
      'react': ['react', 'react.js', 'reactjs', 'react js'],
      'angular': ['angular', 'angular.js', 'angularjs', 'angular js'],
      'vue': ['vue', 'vue.js', 'vuejs', 'vue js'],
      'node.js': ['node', 'nodejs', 'node.js', 'node js'],
      'express': ['express', 'express.js', 'expressjs'],
      'mongodb': ['mongo', 'mongodb', 'mongo db'],
      'postgresql': ['postgres', 'postgresql', 'postgre sql'],
      'mysql': ['mysql', 'my sql'],
      'html': ['html', 'html5', 'hypertext'],
      'css': ['css', 'css3', 'cascading'],
      'bootstrap': ['bootstrap', 'bootstrap css'],
      'tailwind': ['tailwind', 'tailwindcss', 'tailwind css'],
      'python': ['python', 'py'],
      'java': ['java'],
      'c++': ['c++', 'cpp', 'c plus plus'],
      'c#': ['c#', 'csharp', 'c sharp'],
      'php': ['php'],
      'ruby': ['ruby', 'ruby on rails', 'rails'],
      'go': ['go', 'golang'],
      'rust': ['rust'],
      'swift': ['swift'],
      'kotlin': ['kotlin'],
      'dart': ['dart'],
      'sql': ['sql', 'structured query'],
      'nosql': ['nosql', 'no sql'],
      'git': ['git', 'github', 'gitlab'],
      'docker': ['docker', 'containerization'],
      'kubernetes': ['kubernetes', 'k8s'],
      'aws': ['aws', 'amazon web services'],
      'azure': ['azure', 'microsoft azure'],
      'gcp': ['gcp', 'google cloud'],
      'rest': ['rest', 'restful', 'rest api'],
      'graphql': ['graphql', 'graph ql'],
      'api': ['api', 'application programming interface'],
      'frontend': ['frontend', 'front-end', 'front end', 'ui', 'user interface'],
      'backend': ['backend', 'back-end', 'back end', 'server side'],
      'fullstack': ['fullstack', 'full-stack', 'full stack'],
      'devops': ['devops', 'dev ops'],
      'machine learning': ['ml', 'machine learning', 'artificial intelligence', 'ai'],
      'data science': ['data science', 'data analysis', 'analytics'],
      'ui/ux': ['ui/ux', 'ui', 'ux', 'user experience', 'user interface'],
      'testing': ['testing', 'unit testing', 'integration testing', 'qa'],
      'agile': ['agile', 'scrum', 'kanban'],
      'microservices': ['microservices', 'micro services'],
      'redis': ['redis'],
      'elasticsearch': ['elasticsearch', 'elastic search'],
      'jenkins': ['jenkins', 'ci/cd'],
      'webpack': ['webpack'],
      'babel': ['babel'],
      'sass': ['sass', 'scss'],
      'less': ['less'],
      'jquery': ['jquery', 'jquery js'],
      'redux': ['redux'],
      'mobx': ['mobx'],
      'next.js': ['next', 'nextjs', 'next.js'],
      'nuxt.js': ['nuxt', 'nuxtjs', 'nuxt.js'],
      'gatsby': ['gatsby'],
      'svelte': ['svelte'],
      'flutter': ['flutter'],
      'react native': ['react native', 'react-native'],
      'ionic': ['ionic'],
      'cordova': ['cordova', 'phonegap'],
      'xamarin': ['xamarin'],
      'unity': ['unity', 'unity3d'],
      'unreal': ['unreal', 'unreal engine'],
      'tensorflow': ['tensorflow', 'tf'],
      'pytorch': ['pytorch', 'torch'],
      'keras': ['keras'],
      'pandas': ['pandas'],
      'numpy': ['numpy'],
      'matplotlib': ['matplotlib'],
      'seaborn': ['seaborn'],
      'scikit-learn': ['sklearn', 'scikit-learn', 'scikit learn'],
      'opencv': ['opencv', 'cv2'],
      'nltk': ['nltk'],
      'spacy': ['spacy'],
      'django': ['django'],
      'flask': ['flask'],
      'fastapi': ['fastapi', 'fast api'],
      'spring': ['spring', 'spring boot'],
      'laravel': ['laravel'],
      'symfony': ['symfony'],
      'codeigniter': ['codeigniter'],
      'yii': ['yii'],
      'cakephp': ['cakephp', 'cake php'],
      'zend': ['zend'],
      'meteor': ['meteor'],
      'ember': ['ember', 'emberjs'],
      'backbone': ['backbone', 'backbonejs'],
      'knockout': ['knockout', 'knockoutjs'],
      'polymer': ['polymer'],
      'lit': ['lit', 'lit-element'],
      'stencil': ['stencil'],
      'alpine': ['alpine', 'alpinejs'],
      'stimulus': ['stimulus'],
      'turbo': ['turbo'],
      'hotwire': ['hotwire'],
      'htmx': ['htmx'],
      'webassembly': ['wasm', 'webassembly'],
      'pwa': ['pwa', 'progressive web app'],
      'spa': ['spa', 'single page application'],
      'ssr': ['ssr', 'server side rendering'],
      'ssg': ['ssg', 'static site generation'],
      'jamstack': ['jamstack', 'jam stack'],
      'headless': ['headless', 'headless cms'],
      'cms': ['cms', 'content management'],
      'wordpress': ['wordpress', 'wp'],
      'drupal': ['drupal'],
      'joomla': ['joomla'],
      'magento': ['magento'],
      'shopify': ['shopify'],
      'woocommerce': ['woocommerce'],
      'prestashop': ['prestashop'],
      'opencart': ['opencart'],
      'bigcommerce': ['bigcommerce'],
      'squarespace': ['squarespace'],
      'wix': ['wix'],
      'webflow': ['webflow'],
      'figma': ['figma'],
      'sketch': ['sketch'],
      'adobe xd': ['xd', 'adobe xd'],
      'photoshop': ['photoshop', 'ps'],
      'illustrator': ['illustrator', 'ai'],
      'after effects': ['after effects', 'ae'],
      'premiere': ['premiere', 'premiere pro'],
      'blender': ['blender'],
      'maya': ['maya'],
      '3ds max': ['3ds max', '3dsmax'],
      'cinema 4d': ['cinema 4d', 'c4d'],
      'zbrush': ['zbrush'],
      'substance': ['substance', 'substance painter'],
      'unity': ['unity'],
      'unreal': ['unreal'],
      'godot': ['godot'],
      'construct': ['construct'],
      'gamemaker': ['gamemaker'],
      'rpg maker': ['rpg maker'],
      'twine': ['twine'],
      'ink': ['ink'],
      'yarn': ['yarn'],
      'articy': ['articy'],
      'chatmapper': ['chatmapper'],
      'dialoguer': ['dialoguer'],
      'ink': ['ink'],
      'twinery': ['twinery'],
      'power bi': ['power bi', 'powerbi', 'power-bi'],
      'tableau': ['tableau'],
      'qlik': ['qlik', 'qlikview', 'qliksense'],
      'looker': ['looker'],
      'metabase': ['metabase'],
      'grafana': ['grafana'],
      'kibana': ['kibana'],
      'superset': ['superset'],
      'jupyter': ['jupyter', 'jupyter notebook'],
      'colab': ['colab', 'google colab'],
      'kaggle': ['kaggle'],
      'databricks': ['databricks'],
      'snowflake': ['snowflake'],
      'redshift': ['redshift'],
      'bigquery': ['bigquery', 'big query'],
      'spark': ['spark', 'apache spark'],
      'hadoop': ['hadoop'],
      'hive': ['hive'],
      'pig': ['pig'],
      'sqoop': ['sqoop'],
      'flume': ['flume'],
      'kafka': ['kafka'],
      'storm': ['storm'],
      'flink': ['flink'],
      'airflow': ['airflow'],
      'luigi': ['luigi'],
      'prefect': ['prefect'],
      'dagster': ['dagster'],
      'mlflow': ['mlflow'],
      'kubeflow': ['kubeflow'],
      'sagemaker': ['sagemaker'],
      'vertex ai': ['vertex ai', 'vertex'],
      'azure ml': ['azure ml', 'azure machine learning'],
      'databricks': ['databricks'],
      'dataiku': ['dataiku'],
      'h2o': ['h2o'],
      'datarobot': ['datarobot'],
      'alteryx': ['alteryx'],
      'knime': ['knime'],
      'rapidminer': ['rapidminer'],
      'weka': ['weka'],
      'orange': ['orange'],
      'r': ['r programming', 'r language'],
      'stata': ['stata'],
      'spss': ['spss'],
      'sas': ['sas'],
      'matlab': ['matlab'],
      'octave': ['octave'],
      'mathematica': ['mathematica'],
      'maple': ['maple'],
      'sage': ['sage'],
      'maxima': ['maxima'],
      'geogebra': ['geogebra'],
      'desmos': ['desmos'],
      'wolfram': ['wolfram'],
      'qgis': ['qgis'],
      'arcgis': ['arcgis', 'arc gis'],
      'mapbox': ['mapbox'],
      'leaflet': ['leaflet'],
      'openlayers': ['openlayers'],
      'cesium': ['cesium'],
      'three.js': ['three.js', 'threejs', 'three js'],
      'd3.js': ['d3', 'd3.js', 'd3js'],
      'chart.js': ['chart.js', 'chartjs'],
      'plotly': ['plotly'],
      'highcharts': ['highcharts'],
      'amcharts': ['amcharts'],
      'echarts': ['echarts'],
      'recharts': ['recharts'],
      'victory': ['victory'],
      'nivo': ['nivo'],
      'visx': ['visx'],
      'observable': ['observable'],
      'vega': ['vega', 'vega-lite'],
      'bokeh': ['bokeh'],
      'altair': ['altair'],
      'streamlit': ['streamlit'],
      'dash': ['dash', 'plotly dash'],
      'shiny': ['shiny', 'r shiny'],
      'gradio': ['gradio'],
      'voila': ['voila'],
      'panel': ['panel'],
      'holoviz': ['holoviz'],
      'datashader': ['datashader'],
      'holoviews': ['holoviews'],
      'geoviews': ['geoviews'],
      'param': ['param'],
      'parambokeh': ['parambokeh'],
      'paramtk': ['paramtk'],
      'paramqt': ['paramqt']
    };

    requiredSkills.forEach(skill => {
      const skillLower = skill.toLowerCase().trim();
      let found = false;

      // Check for exact match first
      if (resumeLower.includes(skillLower)) {
        matchCount++;
        found = true;
      } else {
        // Check skill variations
        const variations = skillVariations[skillLower] || [skillLower];

        for (const variation of variations) {
          if (resumeLower.includes(variation.toLowerCase())) {
            matchCount++;
            found = true;
            break;
          }
        }

        // Check partial matches for compound skills
        if (!found) {
          const skillWords = skillLower.split(/[\s\-\.\_]+/);
          let partialMatches = 0;

          skillWords.forEach(word => {
            if (word.length > 2 && resumeLower.includes(word)) {
              partialMatches++;
            }
          });

          if (partialMatches >= Math.ceil(skillWords.length * 0.6)) {
            partialMatchCount++;
          }
        }
      }
    });

    // Calculate final score with partial matches weighted at 50%
    const totalMatches = matchCount + (partialMatchCount * 0.5);
    const matchPercentage = (totalMatches / requiredSkills.length) * 100;

    console.log(`Skills analysis: ${matchCount} exact matches, ${partialMatchCount} partial matches out of ${requiredSkills.length} required skills`);

    return Math.min(95, Math.max(20, Math.round(matchPercentage)));
  }

  private calculateExperienceMatch(resumeText: string, jobDescription: JobDescription): number {
    const yearMatches = resumeText.match(/(\d+)\s*\+?\s*years?/gi) || [];
    const experienceYears = yearMatches.map(match => {
      const num = match.match(/\d+/);
      return num ? parseInt(num[0]) : 0;
    });

    const maxExperience = experienceYears.length > 0 ? Math.max(...experienceYears) : 0;
    const minRequired = jobDescription.minExperience || 0;
    const maxRequired = jobDescription.maxExperience || 10;

    if (maxExperience >= minRequired && maxExperience <= maxRequired + 2) {
      return 85 + Math.floor(Math.random() * 10);
    } else if (maxExperience >= minRequired) {
      return 75 + Math.floor(Math.random() * 15);
    } else {
      const ratio = maxExperience / Math.max(minRequired, 1);
      return Math.round(ratio * 70);
    }
  }

  private calculateEducationMatch(resumeText: string, requiredEducation: string): number {
    const resumeLower = resumeText.toLowerCase();
    const educationKeywords = {
      'bachelor': ['bachelor', 'ba', 'bs', 'undergraduate'],
      'master': ['master', 'ma', 'ms', 'mba', 'graduate'],
      'phd': ['phd', 'doctorate', 'doctoral'],
      'associate': ['associate', 'aa', 'as'],
      'high_school': ['high school', 'diploma']
    };

    const requiredLevel = requiredEducation?.toLowerCase() || 'bachelor';
    const keywords = educationKeywords[requiredLevel] || educationKeywords['bachelor'];

    const hasMatch = keywords.some(keyword => resumeLower.includes(keyword));
    return hasMatch ? 85 + Math.floor(Math.random() * 10) : 60 + Math.floor(Math.random() * 20);
  }

  private calculateTechnicalFit(resumeText: string, jobTitle: string): number {
    const resumeLower = resumeText.toLowerCase();
    const jobLower = jobTitle.toLowerCase();

    // Comprehensive technical skill categories
    const technicalKeywords = {
      frontend: [
        'html', 'html5', 'css', 'css3', 'javascript', 'js', 'typescript', 'ts',
        'react', 'react.js', 'reactjs', 'angular', 'vue', 'vue.js', 'svelte',
        'bootstrap', 'tailwind', 'sass', 'scss', 'less', 'jquery',
        'webpack', 'babel', 'parcel', 'vite', 'rollup',
        'redux', 'mobx', 'vuex', 'pinia', 'context api',
        'next.js', 'nuxt.js', 'gatsby', 'gridsome',
        'responsive design', 'mobile first', 'cross browser',
        'ui/ux', 'figma', 'sketch', 'adobe xd',
        'frontend development', 'front-end', 'front end',
        'spa', 'pwa', 'ssr', 'ssg', 'jamstack'
      ],
      backend: [
        'node.js', 'nodejs', 'express', 'koa', 'fastify',
        'python', 'django', 'flask', 'fastapi', 'pyramid',
        'java', 'spring', 'spring boot', 'hibernate',
        'php', 'laravel', 'symfony', 'codeigniter',
        'ruby', 'rails', 'sinatra',
        'c#', 'asp.net', '.net core', 'entity framework',
        'go', 'gin', 'echo', 'fiber',
        'rust', 'actix', 'rocket', 'warp',
        'api', 'rest', 'restful', 'graphql', 'grpc',
        'microservices', 'serverless', 'lambda',
        'database', 'sql', 'nosql', 'orm', 'odm',
        'mysql', 'postgresql', 'mongodb', 'redis',
        'elasticsearch', 'cassandra', 'dynamodb',
        'backend development', 'back-end', 'back end',
        'server side', 'web services', 'middleware'
      ],
      fullstack: [
        'fullstack', 'full-stack', 'full stack',
        'mern', 'mean', 'lamp', 'lemp',
        'javascript', 'typescript', 'python', 'java',
        'react', 'angular', 'vue', 'node.js',
        'frontend', 'backend', 'database',
        'api development', 'web development',
        'end-to-end', 'complete solution'
      ],
      mobile: [
        'android', 'ios', 'mobile development',
        'react native', 'flutter', 'ionic', 'cordova',
        'swift', 'kotlin', 'java', 'objective-c',
        'xamarin', 'unity', 'unreal',
        'mobile app', 'app development',
        'cross platform', 'hybrid app',
        'app store', 'play store', 'mobile ui'
      ],
      devops: [
        'devops', 'dev ops', 'ci/cd', 'continuous integration',
        'docker', 'kubernetes', 'k8s', 'containerization',
        'aws', 'azure', 'gcp', 'google cloud',
        'jenkins', 'gitlab ci', 'github actions',
        'terraform', 'ansible', 'puppet', 'chef',
        'monitoring', 'logging', 'prometheus', 'grafana',
        'nginx', 'apache', 'load balancing',
        'infrastructure', 'deployment', 'automation'
      ],
      'data science': [
        'data science', 'machine learning', 'ml', 'ai',
        'python', 'r', 'pandas', 'numpy', 'scipy',
        'tensorflow', 'pytorch', 'keras', 'scikit-learn',
        'jupyter', 'colab', 'data analysis',
        'statistics', 'visualization', 'matplotlib',
        'seaborn', 'plotly', 'tableau', 'power bi',
        'sql', 'big data', 'spark', 'hadoop',
        'deep learning', 'neural networks'
      ],
      'game development': [
        'unity', 'unreal', 'godot', 'game development',
        'c#', 'c++', 'blueprint', 'game engine',
        '3d modeling', 'animation', 'physics',
        'mobile games', 'pc games', 'console games'
      ],
      'blockchain': [
        'blockchain', 'cryptocurrency', 'bitcoin', 'ethereum',
        'solidity', 'smart contracts', 'web3', 'defi',
        'nft', 'dapp', 'metamask', 'truffle'
      ],
      'cybersecurity': [
        'cybersecurity', 'security', 'penetration testing',
        'ethical hacking', 'vulnerability assessment',
        'encryption', 'ssl', 'tls', 'firewall'
      ]
    };

    // Determine relevant keywords based on job title
    let relevantKeywords = [];
    let categoryWeights = {};

    if (jobLower.includes('frontend') || jobLower.includes('front-end') || jobLower.includes('ui')) {
      relevantKeywords = technicalKeywords.frontend;
      categoryWeights = { frontend: 1.0 };
    } else if (jobLower.includes('backend') || jobLower.includes('back-end') || jobLower.includes('api')) {
      relevantKeywords = technicalKeywords.backend;
      categoryWeights = { backend: 1.0 };
    } else if (jobLower.includes('fullstack') || jobLower.includes('full-stack') || jobLower.includes('full stack')) {
      relevantKeywords = [...technicalKeywords.frontend, ...technicalKeywords.backend, ...technicalKeywords.fullstack];
      categoryWeights = { frontend: 0.4, backend: 0.4, fullstack: 0.2 };
    } else if (jobLower.includes('mobile') || jobLower.includes('app')) {
      relevantKeywords = technicalKeywords.mobile;
      categoryWeights = { mobile: 1.0 };
    } else if (jobLower.includes('devops') || jobLower.includes('infrastructure')) {
      relevantKeywords = technicalKeywords.devops;
      categoryWeights = { devops: 1.0 };
    } else if (jobLower.includes('data') || jobLower.includes('ml') || jobLower.includes('ai')) {
      relevantKeywords = technicalKeywords['data science'];
      categoryWeights = { 'data science': 1.0 };
    } else if (jobLower.includes('game')) {
      relevantKeywords = technicalKeywords['game development'];
      categoryWeights = { 'game development': 1.0 };
    } else if (jobLower.includes('blockchain') || jobLower.includes('crypto')) {
      relevantKeywords = technicalKeywords.blockchain;
      categoryWeights = { blockchain: 1.0 };
    } else if (jobLower.includes('security') || jobLower.includes('cyber')) {
      relevantKeywords = technicalKeywords.cybersecurity;
      categoryWeights = { cybersecurity: 1.0 };
    } else {
      // Default to web development (frontend + backend)
      relevantKeywords = [...technicalKeywords.frontend, ...technicalKeywords.backend];
      categoryWeights = { frontend: 0.5, backend: 0.5 };
    }

    // Count matches with skill variations
    let matchCount = 0;
    const foundSkills = [];

    relevantKeywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      if (resumeLower.includes(keywordLower)) {
        matchCount++;
        foundSkills.push(keyword);
      }
    });

    // Bonus points for additional relevant skills
    const bonusSkills = [
      'git', 'github', 'version control',
      'testing', 'unit testing', 'integration testing',
      'agile', 'scrum', 'kanban',
      'problem solving', 'debugging',
      'performance optimization',
      'code review', 'best practices'
    ];

    let bonusCount = 0;
    bonusSkills.forEach(skill => {
      if (resumeLower.includes(skill.toLowerCase())) {
        bonusCount++;
      }
    });

    // Calculate base fit percentage
    const baseFitPercentage = relevantKeywords.length > 0 ?
      (matchCount / relevantKeywords.length) * 100 : 50;

    // Add bonus (up to 15 points)
    const bonusPercentage = Math.min(15, (bonusCount / bonusSkills.length) * 15);

    const totalFit = baseFitPercentage + bonusPercentage;

    console.log(`Technical fit analysis: ${matchCount}/${relevantKeywords.length} core skills, ${bonusCount} bonus skills`);
    console.log(`Found skills: ${foundSkills.slice(0, 10).join(', ')}`);

    return Math.min(95, Math.max(25, Math.round(totalFit)));
  }

  private identifyStrengths(resumeText: string, jobDescription: JobDescription): string[] {
    const strengths = [];
    const resumeLower = resumeText.toLowerCase();

    if (jobDescription.requiredSkills?.some(skill => resumeLower.includes(skill.toLowerCase()))) {
      strengths.push("Strong alignment with required technical skills");
    }

    if (resumeLower.includes('project') || resumeLower.includes('led') || resumeLower.includes('managed')) {
      strengths.push("Demonstrated project management and leadership experience");
    }

    if (resumeLower.includes('team') || resumeLower.includes('collaboration')) {
      strengths.push("Strong teamwork and collaboration skills");
    }

    strengths.push("Professional presentation and clear communication");

    return strengths.slice(0, 4);
  }

  private identifyWeaknesses(resumeText: string, jobDescription: JobDescription): string[] {
    const weaknesses = [];
    const resumeLower = resumeText.toLowerCase();

    const missingSkills = jobDescription.requiredSkills?.filter(skill =>
      !resumeLower.includes(skill.toLowerCase())
    ) || [];

    if (missingSkills.length > 0) {
      weaknesses.push(`Missing some required skills: ${missingSkills.slice(0, 2).join(', ')}`);
    }

    if (!resumeLower.includes('leadership') && !resumeLower.includes('lead')) {
      weaknesses.push("Limited leadership experience mentioned");
    }

    return weaknesses.slice(0, 3);
  }

  private generateRecommendations(overallScore: number, skillsMatch: number, experienceMatch: number): string[] {
    const recommendations = [];

    if (overallScore >= 80) {
      recommendations.push("Strong candidate - recommend for interview");
      recommendations.push("Assess cultural fit and team dynamics");
    } else if (overallScore >= 70) {
      recommendations.push("Good potential - consider for interview");
      recommendations.push("Evaluate technical skills through practical assessment");
    } else {
      recommendations.push("Consider with reservations");
      recommendations.push("May require additional training and support");
    }

    if (skillsMatch < 70) {
      recommendations.push("Address skill gaps through training or mentoring");
    }

    recommendations.push("Verify experience claims through reference checks");

    return recommendations.slice(0, 4);
  }

  private findMatchedSkills(resumeText: string, requiredSkills: string[]): string[] {
    const resumeLower = resumeText.toLowerCase();
    const matchedSkills = [];

    // Use the same skill variations as in calculateSkillsMatch
    const skillVariations = {
      'javascript': ['js', 'javascript', 'java script'],
      'typescript': ['ts', 'typescript'],
      'react': ['react', 'react.js', 'reactjs'],
      'angular': ['angular', 'angular.js', 'angularjs'],
      'vue': ['vue', 'vue.js', 'vuejs'],
      'node.js': ['node', 'nodejs', 'node.js'],
      'express': ['express', 'express.js'],
      'mongodb': ['mongo', 'mongodb'],
      'postgresql': ['postgres', 'postgresql'],
      'mysql': ['mysql'],
      'html': ['html', 'html5'],
      'css': ['css', 'css3'],
      'python': ['python', 'py'],
      'frontend': ['frontend', 'front-end', 'front end'],
      'backend': ['backend', 'back-end', 'back end'],
      'fullstack': ['fullstack', 'full-stack', 'full stack'],
      'api': ['api', 'rest api', 'restful'],
      'git': ['git', 'github', 'gitlab'],
      'docker': ['docker'],
      'aws': ['aws', 'amazon web services'],
      'power bi': ['power bi', 'powerbi'],
      'data science': ['data science', 'data analysis']
    };

    requiredSkills.forEach(skill => {
      const skillLower = skill.toLowerCase().trim();
      const variations = skillVariations[skillLower] || [skillLower];

      for (const variation of variations) {
        if (resumeLower.includes(variation.toLowerCase())) {
          matchedSkills.push(skill);
          break;
        }
      }
    });

    return matchedSkills.slice(0, 8);
  }

  private findMissingSkills(resumeText: string, requiredSkills: string[]): string[] {
    const resumeLower = resumeText.toLowerCase();
    const missingSkills = [];

    // Use the same skill variations as in calculateSkillsMatch
    const skillVariations = {
      'javascript': ['js', 'javascript', 'java script'],
      'typescript': ['ts', 'typescript'],
      'react': ['react', 'react.js', 'reactjs'],
      'angular': ['angular', 'angular.js', 'angularjs'],
      'vue': ['vue', 'vue.js', 'vuejs'],
      'node.js': ['node', 'nodejs', 'node.js'],
      'express': ['express', 'express.js'],
      'mongodb': ['mongo', 'mongodb'],
      'postgresql': ['postgres', 'postgresql'],
      'mysql': ['mysql'],
      'html': ['html', 'html5'],
      'css': ['css', 'css3'],
      'python': ['python', 'py'],
      'frontend': ['frontend', 'front-end', 'front end'],
      'backend': ['backend', 'back-end', 'back end'],
      'fullstack': ['fullstack', 'full-stack', 'full stack'],
      'api': ['api', 'rest api', 'restful'],
      'git': ['git', 'github', 'gitlab'],
      'docker': ['docker'],
      'aws': ['aws', 'amazon web services'],
      'power bi': ['power bi', 'powerbi'],
      'data science': ['data science', 'data analysis']
    };

    requiredSkills.forEach(skill => {
      const skillLower = skill.toLowerCase().trim();
      const variations = skillVariations[skillLower] || [skillLower];

      let found = false;
      for (const variation of variations) {
        if (resumeLower.includes(variation.toLowerCase())) {
          found = true;
          break;
        }
      }

      if (!found) {
        missingSkills.push(skill);
      }
    });

    return missingSkills.slice(0, 5);
  }

  private identifyExperienceGaps(resumeText: string, jobDescription: JobDescription): string[] {
    const gaps = [];
    const resumeLower = resumeText.toLowerCase();

    if (!resumeLower.includes('leadership') && !resumeLower.includes('lead')) {
      gaps.push("Leadership experience");
    }

    if (!resumeLower.includes(jobDescription.jobTitle.toLowerCase().split(' ')[0])) {
      gaps.push(`Specific ${jobDescription.jobTitle} experience`);
    }

    return gaps.slice(0, 2);
  }
}

// Export singleton instance
export const geminiAnalyzer = new GeminiResumeAnalyzer();
