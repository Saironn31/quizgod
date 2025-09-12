/**
 * PDF Question Application
 * Main application class integrating all components
 */

import { PDFQuestionSystem, PDFQuestionResult } from './PDFQuestionSystem';
import { Question } from './QuestionGeneratorModel';

export interface AppConfig {
  autoInitialize: boolean;
  trainNewModel: boolean;
  enableCache: boolean;
  debugMode: boolean;
}

export class PDFQAApplication {
  private pdfSystem: PDFQuestionSystem;
  private config: AppConfig;
  private isReady: boolean = false;
  private loadingCallbacks: Array<(progress: string) => void> = [];

  constructor(config?: Partial<AppConfig>) {
    this.config = {
      autoInitialize: true,
      trainNewModel: false,
      enableCache: true,
      debugMode: true,
      ...config
    };

    this.pdfSystem = new PDFQuestionSystem();
  }

  /**
   * Initialize the application
   */
  async init(): Promise<void> {
    console.log('🚀 Starting PDF Question Application...');
    
    if (this.config.autoInitialize) {
      await this.initializeSystem();
    }

    this.setupEventListeners();
    this.updateUI();
    
    console.log('✅ PDF Question Application ready!');
  }

  /**
   * Initialize the AI system
   */
  private async initializeSystem(): Promise<void> {
    try {
      this.notifyProgress('🔧 Initializing AI system...');
      
      await this.pdfSystem.initialize(this.config.trainNewModel);
      
      this.isReady = true;
      this.notifyProgress('✅ AI system ready');
      
    } catch (error) {
      console.error('Failed to initialize system:', error);
      this.notifyProgress('❌ System initialization failed');
      throw error;
    }
  }

  /**
   * Setup event listeners for the UI
   */
  private setupEventListeners(): void {
    // PDF upload handler
    const pdfUpload = document.getElementById('pdf-upload') as HTMLInputElement;
    if (pdfUpload) {
      pdfUpload.addEventListener('change', this.handlePDFUpload.bind(this));
    }

    // Generate questions button
    const generateBtn = document.getElementById('generate-questions-btn') as HTMLButtonElement;
    if (generateBtn) {
      generateBtn.addEventListener('click', this.handleGenerateQuestions.bind(this));
    }

    // Question type filters
    const questionTypeCheckboxes = document.querySelectorAll('input[name="question-type"]');
    questionTypeCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', this.updateQuestionTypes.bind(this));
    });

    // Number of questions slider
    const questionCountSlider = document.getElementById('question-count') as HTMLInputElement;
    if (questionCountSlider) {
      questionCountSlider.addEventListener('input', this.updateQuestionCount.bind(this));
    }

    // Initialize model button
    const initBtn = document.getElementById('init-model-btn') as HTMLButtonElement;
    if (initBtn) {
      initBtn.addEventListener('click', this.initializeSystem.bind(this));
    }

    // Train new model button
    const trainBtn = document.getElementById('train-model-btn') as HTMLButtonElement;
    if (trainBtn) {
      trainBtn.addEventListener('click', this.trainNewModel.bind(this));
    }
  }

  /**
   * Handle PDF file upload
   */
  private async handlePDFUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;

    console.log('📄 PDF uploaded:', file.name);
    this.updateFileInfo(file);
    this.enableGenerateButton();
  }

  /**
   * Handle question generation
   */
  private async handleGenerateQuestions(): Promise<void> {
    if (!this.isReady) {
      alert('System not ready. Please wait for initialization to complete.');
      return;
    }

    const fileInput = document.getElementById('pdf-upload') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    
    if (!file) {
      alert('Please select a PDF file first.');
      return;
    }

    try {
      this.showLoadingState();
      
      const options = {
        numQuestions: this.getQuestionCount(),
        questionTypes: this.getSelectedQuestionTypes(),
        useCache: this.config.enableCache
      };

      console.log('🔄 Generating questions with options:', options);
      
      const result = await this.pdfSystem.processPDF(file, options);
      
      this.displayResults(result);
      this.hideLoadingState();
      
    } catch (error) {
      console.error('Error generating questions:', error);
      this.showError(`Failed to generate questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.hideLoadingState();
    }
  }

  /**
   * Train a new model
   */
  private async trainNewModel(): Promise<void> {
    try {
      this.showLoadingState('🎓 Training new model... This may take several minutes.');
      
      await this.pdfSystem.initialize(true);
      
      this.isReady = true;
      this.hideLoadingState();
      this.showSuccess('Model training completed successfully!');
      
    } catch (error) {
      console.error('Error training model:', error);
      this.showError(`Failed to train model: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.hideLoadingState();
    }
  }

  /**
   * Display question generation results
   */
  private displayResults(result: PDFQuestionResult): void {
    const container = document.getElementById('questions-container');
    if (!container) return;

    container.innerHTML = '';

    // Display metadata
    this.displayMetadata(result.metadata);

    // Display questions
    result.questions.forEach((question, index) => {
      const questionElement = this.createQuestionElement(question, index);
      container.appendChild(questionElement);
    });

    // Show results section
    const resultsSection = document.getElementById('results-section');
    if (resultsSection) {
      resultsSection.style.display = 'block';
      resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  /**
   * Create HTML element for a question
   */
  private createQuestionElement(question: Question, index: number): HTMLElement {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-purple-200 dark:border-gray-600';
    
    const confidenceColor = question.confidence > 0.8 ? 'text-green-600' : 
                           question.confidence > 0.6 ? 'text-yellow-600' : 'text-red-600';

    questionDiv.innerHTML = `
      <div class="flex justify-between items-start mb-4">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Question ${index + 1}
        </h3>
        <div class="flex items-center space-x-2">
          <span class="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            ${question.type}
          </span>
          <span class="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 ${confidenceColor} dark:bg-gray-700">
            ${Math.round(question.confidence * 100)}%
          </span>
        </div>
      </div>
      
      <div class="question-content">
        <p class="text-gray-700 dark:text-gray-300 mb-4 font-medium">
          ${question.question}
        </p>
        
        ${question.options ? this.createOptionsHTML(question.options, question.correct || 0) : ''}
      </div>
      
      ${this.config.debugMode ? `
        <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded text-sm">
          <strong>Debug Info:</strong><br>
          Type: ${question.type}<br>
          Confidence: ${question.confidence.toFixed(3)}<br>
          Context Length: ${question.context?.length || 0} chars
        </div>
      ` : ''}
    `;

    return questionDiv;
  }

  /**
   * Create HTML for multiple choice options
   */
  private createOptionsHTML(options: string[], correctIndex: number): string {
    return `
      <div class="options-container mt-4">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Multiple Choice Options:</p>
        <div class="space-y-2">
          ${options.map((option, index) => `
            <div class="option-item flex items-start space-x-3">
              <span class="flex-shrink-0 w-6 h-6 rounded-full border-2 border-purple-300 flex items-center justify-center text-sm font-semibold ${
                index === correctIndex ? 'bg-green-100 border-green-500 text-green-800' : 'text-purple-600'
              }">
                ${String.fromCharCode(65 + index)}
              </span>
              <span class="text-gray-700 dark:text-gray-300 ${
                index === correctIndex ? 'font-semibold text-green-800 dark:text-green-400' : ''
              }">
                ${option}
              </span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Display processing metadata
   */
  private displayMetadata(metadata: PDFQuestionResult['metadata']): void {
    const metadataContainer = document.getElementById('metadata-container');
    if (!metadataContainer) return;

    metadataContainer.innerHTML = `
      <div class="metadata-grid grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="stat-item bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
            ${(metadata.processingTime / 1000).toFixed(1)}s
          </div>
          <div class="text-sm text-blue-600 dark:text-blue-400">Processing Time</div>
        </div>
        
        <div class="stat-item bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div class="text-2xl font-bold text-green-600 dark:text-green-400">
            ${(metadata.textLength / 1000).toFixed(1)}k
          </div>
          <div class="text-sm text-green-600 dark:text-green-400">Characters</div>
        </div>
        
        <div class="stat-item bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
            ${metadata.segmentCount}
          </div>
          <div class="text-sm text-purple-600 dark:text-purple-400">Text Segments</div>
        </div>
        
        <div class="stat-item bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            ${Math.round(metadata.modelConfidence * 100)}%
          </div>
          <div class="text-sm text-yellow-600 dark:text-yellow-400">Avg Confidence</div>
        </div>
      </div>
    `;
  }

  /**
   * Update file information display
   */
  private updateFileInfo(file: File): void {
    const fileInfo = document.getElementById('file-info');
    if (fileInfo) {
      fileInfo.innerHTML = `
        <div class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <span>📄</span>
          <span>${file.name}</span>
          <span>•</span>
          <span>${(file.size / 1024 / 1024).toFixed(2)} MB</span>
        </div>
      `;
    }
  }

  /**
   * Enable/disable generate button
   */
  private enableGenerateButton(): void {
    const btn = document.getElementById('generate-questions-btn') as HTMLButtonElement;
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🚀 Generate Questions';
    }
  }

  /**
   * Get selected question count
   */
  private getQuestionCount(): number {
    const slider = document.getElementById('question-count') as HTMLInputElement;
    return slider ? parseInt(slider.value) : 5;
  }

  /**
   * Get selected question types
   */
  private getSelectedQuestionTypes(): Question['type'][] {
    const checkboxes = document.querySelectorAll('input[name="question-type"]:checked') as NodeListOf<HTMLInputElement>;
    const types: Question['type'][] = [];
    
    checkboxes.forEach(checkbox => {
      types.push(checkbox.value as Question['type']);
    });
    
    return types.length > 0 ? types : ['factual', 'conceptual', 'analytical'];
  }

  /**
   * Update question types based on checkbox changes
   */
  private updateQuestionTypes(): void {
    const types = this.getSelectedQuestionTypes();
    console.log('Selected question types:', types);
  }

  /**
   * Update question count display
   */
  private updateQuestionCount(): void {
    const count = this.getQuestionCount();
    const display = document.getElementById('question-count-display');
    if (display) {
      display.textContent = count.toString();
    }
  }

  /**
   * Show loading state
   */
  private showLoadingState(message: string = '🔄 Generating questions...'): void {
    const btn = document.getElementById('generate-questions-btn') as HTMLButtonElement;
    if (btn) {
      btn.disabled = true;
      btn.textContent = message;
    }

    this.showProgress(message);
  }

  /**
   * Hide loading state
   */
  private hideLoadingState(): void {
    const btn = document.getElementById('generate-questions-btn') as HTMLButtonElement;
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🚀 Generate Questions';
    }

    this.hideProgress();
  }

  /**
   * Show progress indicator
   */
  private showProgress(message: string): void {
    let progressDiv = document.getElementById('progress-indicator');
    if (!progressDiv) {
      progressDiv = document.createElement('div');
      progressDiv.id = 'progress-indicator';
      progressDiv.className = 'fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      document.body.appendChild(progressDiv);
    }
    
    progressDiv.textContent = message;
    progressDiv.style.display = 'block';
  }

  /**
   * Hide progress indicator
   */
  private hideProgress(): void {
    const progressDiv = document.getElementById('progress-indicator');
    if (progressDiv) {
      progressDiv.style.display = 'none';
    }
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    errorDiv.textContent = `❌ ${message}`;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      document.body.removeChild(errorDiv);
    }, 5000);
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    successDiv.textContent = `✅ ${message}`;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      document.body.removeChild(successDiv);
    }, 5000);
  }

  /**
   * Update UI based on system state
   */
  private updateUI(): void {
    const statusIndicator = document.getElementById('system-status');
    if (statusIndicator) {
      statusIndicator.className = this.isReady ? 
        'status-ready text-green-600' : 'status-loading text-yellow-600';
      statusIndicator.textContent = this.isReady ? '✅ Ready' : '⏳ Loading...';
    }
  }

  /**
   * Notify progress to registered callbacks
   */
  private notifyProgress(message: string): void {
    console.log(message);
    this.loadingCallbacks.forEach(callback => callback(message));
    this.showProgress(message);
  }

  /**
   * Register progress callback
   */
  onProgress(callback: (progress: string) => void): void {
    this.loadingCallbacks.push(callback);
  }

  /**
   * Get system statistics
   */
  getStats(): any {
    return {
      isReady: this.isReady,
      config: this.config,
      systemStats: this.pdfSystem.getSystemStats()
    };
  }

  /**
   * Export questions to JSON
   */
  exportQuestions(): void {
    const container = document.getElementById('questions-container');
    if (!container) return;

    // This would collect all displayed questions
    const questions = Array.from(container.children).map((element, index) => {
      return {
        question: `Question ${index + 1}`,
        // Extract actual question data from DOM or store in memory
      };
    });

    const dataStr = JSON.stringify(questions, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'generated_questions.json';
    link.click();
  }
}
