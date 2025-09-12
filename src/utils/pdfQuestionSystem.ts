/**
 * PDF Question System - Complete Integration
 * Combines PDF processing with custom-trained model for question generation
 */

import { QuestionGeneratorModel, GeneratedQuestion, QuestionGenerationOptions } from './questionGeneratorModel';
import { ModelTrainer, TrainingConfig } from './modelTrainer';
import { extractRealTextFromPDF } from './realPdfReader';

export interface PDFProcessingOptions {
  segmentSize: number;
  overlap: number;
  minSegmentLength: number;
  maxSegments: number;
}

export interface ProcessingResult {
  segments: TextSegment[];
  questions: GeneratedQuestion[];
  processingTime: number;
  metadata: PDFMetadata;
}

export interface TextSegment {
  text: string;
  startIndex: number;
  endIndex: number;
  concepts: string[];
  questionCount: number;
}

export interface PDFMetadata {
  fileName: string;
  pageCount: number;
  totalWords: number;
  extractedText: string;
  processingDate: Date;
}

/**
 * Main PDF Question System Class
 */
export class PDFQuestionSystem {
  private questionGenerator: QuestionGeneratorModel;
  private trainer: ModelTrainer;
  private cache: Map<string, ProcessingResult> = new Map();
  private isModelLoaded: boolean = false;

  constructor() {
    this.questionGenerator = new QuestionGeneratorModel();
    this.trainer = new ModelTrainer();
    this.initializeSystem();
  }

  /**
   * Initialize the system and load models
   */
  private async initializeSystem(): Promise<void> {
    try {
      console.log('Initializing PDF Question System...');
      
      // Try to load pre-trained model
      await this.questionGenerator.loadModel('file://./models/final');
      this.isModelLoaded = true;
      console.log('Pre-trained model loaded successfully');
    } catch (error) {
      console.log('No pre-trained model found, initializing fresh model');
      await this.questionGenerator.initialize();
      this.isModelLoaded = true;
    }
  }

  /**
   * Process PDF file and generate questions
   */
  async processPDF(
    pdfFile: File,
    questionOptions: QuestionGenerationOptions,
    processingOptions: PDFProcessingOptions = {
      segmentSize: 500,
      overlap: 50,
      minSegmentLength: 100,
      maxSegments: 10
    },
    onProgress?: (progress: string) => void
  ): Promise<ProcessingResult> {
    const startTime = performance.now();
    
    if (onProgress) onProgress('🔄 Initializing system...');
    
    // Ensure model is loaded
    if (!this.isModelLoaded) {
      await this.initializeSystem();
    }

    // Generate cache key
    const cacheKey = this.generateCacheKey(pdfFile, questionOptions, processingOptions);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      if (onProgress) onProgress('✅ Loading from cache...');
      return this.cache.get(cacheKey)!;
    }

    try {
      // Extract text from PDF
      if (onProgress) onProgress('📄 Extracting text from PDF...');
      const extractedText = await extractRealTextFromPDF(pdfFile, onProgress);
      
      // Create metadata
      const metadata: PDFMetadata = {
        fileName: pdfFile.name,
        pageCount: 0, // Will be updated by PDF reader
        totalWords: extractedText.split(/\s+/).length,
        extractedText: extractedText.substring(0, 1000) + '...', // Preview only
        processingDate: new Date()
      };

      // Segment text into logical chunks
      if (onProgress) onProgress('🔍 Segmenting text for optimal processing...');
      const segments = this.segmentText(extractedText, processingOptions);
      
      // Generate questions for each segment
      if (onProgress) onProgress('🧠 Generating intelligent questions...');
      const allQuestions: GeneratedQuestion[] = [];
      
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        
        if (onProgress) {
          onProgress(`🔄 Processing segment ${i + 1}/${segments.length}...`);
        }

        try {
          // Adjust question count per segment
          const segmentQuestionOptions = {
            ...questionOptions,
            numQuestions: Math.ceil(questionOptions.numQuestions / segments.length),
            qualityThreshold: 0.6
          };

          const segmentQuestions = await this.questionGenerator.generateQuestions(
            segment.text,
            segmentQuestionOptions
          );

          // Add segment info to questions
          segmentQuestions.forEach(q => {
            q.context = segment.text.substring(0, 200) + '...';
          });

          allQuestions.push(...segmentQuestions);
          segments[i].questionCount = segmentQuestions.length;

        } catch (error) {
          console.warn(`Failed to generate questions for segment ${i + 1}:`, error);
          segments[i].questionCount = 0;
        }
      }

      // Sort questions by confidence and select best ones
      const sortedQuestions = allQuestions
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, questionOptions.numQuestions);

      const result: ProcessingResult = {
        segments,
        questions: sortedQuestions,
        processingTime: performance.now() - startTime,
        metadata
      };

      // Cache the result
      this.cache.set(cacheKey, result);

      if (onProgress) {
        onProgress(`✅ Generated ${sortedQuestions.length} high-quality questions in ${(result.processingTime / 1000).toFixed(2)}s`);
      }

      return result;

    } catch (error) {
      console.error('PDF processing error:', error);
      throw new Error(`Failed to process PDF: ${error.message}`);
    }
  }

  /**
   * Segment text into logical chunks for processing
   */
  private segmentText(text: string, options: PDFProcessingOptions): TextSegment[] {
    const segments: TextSegment[] = [];
    
    // Clean the text first
    const cleanedText = text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    // Split by paragraphs first, then by sentences if needed
    const paragraphs = cleanedText.split(/\n\s*\n/);
    let currentSegment = '';
    let startIndex = 0;

    for (const paragraph of paragraphs) {
      const sentences = paragraph.split(/[.!?]+/).filter(s => s.trim().length > 0);
      
      for (const sentence of sentences) {
        const trimmedSentence = sentence.trim();
        
        if (trimmedSentence.length < 20) continue; // Skip very short sentences

        // Check if adding this sentence exceeds segment size
        if (currentSegment.length + trimmedSentence.length > options.segmentSize && currentSegment.length > 0) {
          // Create segment if it meets minimum length
          if (currentSegment.length >= options.minSegmentLength) {
            const segment = this.createSegment(currentSegment, startIndex, segments.length < options.maxSegments);
            if (segment) segments.push(segment);
          }

          // Start new segment with overlap
          const overlapText = this.getOverlapText(currentSegment, options.overlap);
          currentSegment = overlapText + ' ' + trimmedSentence;
          startIndex = cleanedText.indexOf(trimmedSentence);
        } else {
          currentSegment += (currentSegment ? ' ' : '') + trimmedSentence;
          if (!startIndex) startIndex = cleanedText.indexOf(trimmedSentence);
        }

        // Stop if we have enough segments
        if (segments.length >= options.maxSegments) break;
      }

      if (segments.length >= options.maxSegments) break;
    }

    // Add final segment if it exists and meets criteria
    if (currentSegment.length >= options.minSegmentLength && segments.length < options.maxSegments) {
      const segment = this.createSegment(currentSegment, startIndex, true);
      if (segment) segments.push(segment);
    }

    return segments;
  }

  /**
   * Create a text segment with extracted concepts
   */
  private createSegment(text: string, startIndex: number, shouldCreate: boolean): TextSegment | null {
    if (!shouldCreate) return null;

    const concepts = this.extractConcepts(text);
    
    return {
      text: text.trim(),
      startIndex,
      endIndex: startIndex + text.length,
      concepts,
      questionCount: 0 // Will be updated during processing
    };
  }

  /**
   * Get overlap text from the end of current segment
   */
  private getOverlapText(text: string, overlapSize: number): string {
    const words = text.trim().split(/\s+/);
    const overlapWords = words.slice(-Math.min(overlapSize, words.length));
    return overlapWords.join(' ');
  }

  /**
   * Extract key concepts from text segment
   */
  private extractConcepts(text: string): string[] {
    // Extract capitalized words and phrases (likely to be concepts)
    const concepts = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    
    // Filter out common words
    const commonWords = ['The', 'This', 'That', 'These', 'Those', 'When', 'Where', 'What', 'How', 'Why'];
    const filteredConcepts = concepts.filter(concept => 
      !commonWords.includes(concept) && concept.length > 2
    );

    // Remove duplicates and limit count
    return [...new Set(filteredConcepts)].slice(0, 10);
  }

  /**
   * Generate cache key for processing results
   */
  private generateCacheKey(
    file: File,
    questionOptions: QuestionGenerationOptions,
    processingOptions: PDFProcessingOptions
  ): string {
    const fileInfo = `${file.name}_${file.size}_${file.lastModified}`;
    const optionsInfo = JSON.stringify({ questionOptions, processingOptions });
    return btoa(fileInfo + optionsInfo); // Base64 encode
  }

  /**
   * Train the model with custom data
   */
  async trainModel(
    trainingConfig: TrainingConfig,
    onProgress?: (metrics: any) => void
  ): Promise<void> {
    console.log('Starting model training...');
    
    const metrics = await this.trainer.trainQuestionGenerator(trainingConfig);
    
    if (onProgress) {
      metrics.forEach(metric => onProgress(metric));
    }

    // Reload the trained model
    await this.questionGenerator.loadModel('file://./models/final');
    console.log('Model training completed and reloaded');
  }

  /**
   * Add training data from user feedback
   */
  addUserFeedback(
    context: string,
    question: string,
    isGoodQuestion: boolean,
    questionType: string
  ): void {
    if (isGoodQuestion) {
      const trainingData = [{
        context,
        questions: [{
          question,
          type: questionType,
          answer: "User approved answer" // Could be enhanced
        }]
      }];
      
      this.trainer.addTrainingData(trainingData);
      console.log('Added positive training example');
    }
  }

  /**
   * Get system statistics
   */
  getStatistics(): {
    cacheSize: number;
    modelLoaded: boolean;
    totalProcessedFiles: number;
  } {
    return {
      cacheSize: this.cache.size,
      modelLoaded: this.isModelLoaded,
      totalProcessedFiles: this.cache.size
    };
  }

  /**
   * Clear cache to free memory
   */
  clearCache(): void {
    this.cache.clear();
    console.log('Cache cleared');
  }

  /**
   * Export system configuration and data
   */
  exportData(): {
    trainingData: string;
    cacheKeys: string[];
    statistics: any;
  } {
    return {
      trainingData: this.trainer.exportTrainingData(),
      cacheKeys: Array.from(this.cache.keys()),
      statistics: this.getStatistics()
    };
  }

  /**
   * Import training data
   */
  importTrainingData(jsonData: string): void {
    this.trainer.importTrainingData(jsonData);
  }

  /**
   * Evaluate question quality manually
   */
  async evaluateQuestion(question: GeneratedQuestion): Promise<{
    score: number;
    feedback: string[];
  }> {
    const feedback: string[] = [];
    let score = 0.5;

    // Check question structure
    if (/^(what|how|why|when|where|which|who)/i.test(question.question)) {
      score += 0.1;
      feedback.push('✓ Proper question format');
    } else {
      feedback.push('⚠ Consider starting with a question word');
    }

    // Check length
    if (question.question.length > 10 && question.question.length < 150) {
      score += 0.1;
      feedback.push('✓ Appropriate length');
    } else {
      feedback.push('⚠ Question length could be improved');
    }

    // Check options quality
    const uniqueOptions = new Set(question.options);
    if (uniqueOptions.size === question.options.length) {
      score += 0.1;
      feedback.push('✓ All options are unique');
    } else {
      feedback.push('⚠ Some answer options are duplicated');
    }

    // Check context relevance
    if (question.context && question.context.length > 50) {
      score += 0.2;
      feedback.push('✓ Good context provided');
    }

    return {
      score: Math.min(1.0, score),
      feedback
    };
  }
}
