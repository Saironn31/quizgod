/**
 * PDF Question System
 * Integrates PDF processing with the custom-trained transformer model
 * Now with OCR support for scanned documents
 */

import { QuestionGeneratorModel, Question } from './QuestionGeneratorModel';
import { ModelTrainer, TrainingData } from './ModelTrainer';
import { extractTextWithOCR } from '../utils/ocrPdfReader';

export interface PDFQuestionResult {
  questions: Question[];
  context: string;
  metadata: {
    processingTime: number;
    textLength: number;
    segmentCount: number;
    modelConfidence: number;
  };
}

export interface TextSegment {
  text: string;
  startPosition: number;
  endPosition: number;
  importance: number;
}

export class PDFQuestionSystem {
  private questionGenerator: QuestionGeneratorModel;
  private trainer: ModelTrainer;
  private cache: Map<string, PDFQuestionResult> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.questionGenerator = new QuestionGeneratorModel({
      vocabularySize: 30000,
      embeddingDim: 512,
      numHeads: 8,
      numLayers: 6,
      maxSequenceLength: 512,
      dropoutRate: 0.1
    });
    
    this.trainer = new ModelTrainer(this.questionGenerator, {
      epochs: 50,
      batchSize: 8,
      learningRate: 0.0001,
      validationSplit: 0.2
    });
  }

  /**
   * Initialize the system with model loading/training
   */
  async initialize(trainNewModel: boolean = false): Promise<void> {
    console.log('Initializing PDF Question System...');
    const startTime = Date.now();

    try {
      if (trainNewModel) {
        // Train a new model from scratch
        await this.trainNewModel();
      } else {
        // Try to load existing model, fallback to training if not found
        try {
          await this.questionGenerator.loadModel('./models/trained');
          console.log('Loaded pre-trained model successfully');
        } catch (error) {
          console.log('No pre-trained model found, training new model...');
          await this.trainNewModel();
        }
      }

      this.isInitialized = true;
      const initTime = Date.now() - startTime;
      console.log(`PDF Question System initialized in ${initTime}ms`);

    } catch (error) {
      console.error('Failed to initialize PDF Question System:', error);
      throw error;
    }
  }

  /**
   * Train a new model with synthetic and domain data
   */
  private async trainNewModel(): Promise<void> {
    console.log('Training new question generation model...');
    
    // Initialize the model architecture
    await this.questionGenerator.initialize();
    
    // Generate synthetic training data
    const syntheticData = this.trainer.generateSyntheticData();
    
    // Add domain-specific training data
    const domainData = this.generateDomainSpecificData();
    const allTrainingData = [...syntheticData, ...domainData];
    
    // Train the model
    await this.trainer.trainQuestionGenerator(allTrainingData);
    
    // Save the trained model
    await this.questionGenerator.saveModel('./models/trained');
    
    console.log('Model training completed and saved');
  }

  /**
   * Generate domain-specific training data for PDF documents
   */
  private generateDomainSpecificData(): TrainingData[] {
    return [
      {
        context: "Computer hardware consists of the physical components of a computer system. The main components include the motherboard, processor (CPU), memory (RAM), storage devices, and input/output devices. Each component plays a crucial role in the overall functioning of the computer.",
        questions: [
          {
            question: "What are the main components of computer hardware?",
            type: "factual",
            answer: "Motherboard, processor (CPU), memory (RAM), storage devices, and input/output devices"
          },
          {
            question: "What is computer hardware?",
            type: "definition", 
            answer: "The physical components of a computer system"
          },
          {
            question: "How do the hardware components work together?",
            type: "conceptual",
            answer: "Each component plays a crucial role in the overall functioning of the computer"
          }
        ]
      },
      {
        context: "Software engineering is the systematic application of engineering approaches to the development of software. It involves requirements analysis, design, implementation, testing, and maintenance. The goal is to create reliable, efficient, and maintainable software systems.",
        questions: [
          {
            question: "What is software engineering?",
            type: "definition",
            answer: "The systematic application of engineering approaches to software development"
          },
          {
            question: "What are the main phases of software engineering?",
            type: "factual",
            answer: "Requirements analysis, design, implementation, testing, and maintenance"
          },
          {
            question: "What is the goal of software engineering?",
            type: "conceptual",
            answer: "To create reliable, efficient, and maintainable software systems"
          }
        ]
      },
      {
        context: "Artificial intelligence (AI) refers to the simulation of human intelligence in machines that are programmed to think like humans and mimic their actions. The term may also be applied to any machine that exhibits traits associated with a human mind such as learning and problem-solving.",
        questions: [
          {
            question: "What is artificial intelligence?",
            type: "definition",
            answer: "The simulation of human intelligence in machines programmed to think like humans"
          },
          {
            question: "What traits might an AI machine exhibit?",
            type: "factual",
            answer: "Learning and problem-solving"
          },
          {
            question: "How does AI mimic human intelligence?",
            type: "analytical",
            answer: "By programming machines to think like humans and exhibit traits like learning and problem-solving"
          }
        ]
      }
    ];
  }

  /**
   * Process PDF file and generate questions
   */
  async processPDF(
    pdfFile: File, 
    options: {
      numQuestions?: number;
      questionTypes?: Question['type'][];
      useCache?: boolean;
    } = {}
  ): Promise<PDFQuestionResult> {
    
    if (!this.isInitialized) {
      throw new Error('System not initialized. Call initialize() first.');
    }

    const startTime = Date.now();
    const {
      numQuestions = 5,
      questionTypes = ['factual', 'conceptual', 'analytical'],
      useCache = true
    } = options;

    // Check cache first
    const cacheKey = `${pdfFile.name}_${pdfFile.size}_${numQuestions}`;
    if (useCache && this.cache.has(cacheKey)) {
      console.log('Returning cached result for:', pdfFile.name);
      return this.cache.get(cacheKey)!;
    }

    console.log('Processing PDF:', pdfFile.name);

    try {
      // Extract text from PDF with OCR support
      const extractedText = await extractTextWithOCR(pdfFile, (progress) => {
        console.log('📄 PDF extraction progress:', progress);
      });

      if (!extractedText || extractedText.length < 50) {
        throw new Error('Insufficient text extracted from PDF');
      }

      // Segment text into logical chunks
      const segments = this.segmentText(extractedText);
      console.log(`Text segmented into ${segments.length} chunks`);

      // Generate questions for each segment
      const allQuestions: Question[] = [];
      let totalConfidence = 0;

      for (const segment of segments) {
        try {
          const segmentQuestions = await this.questionGenerator.generateQuestions(
            segment.text,
            Math.ceil(numQuestions / segments.length)
          );

          // Filter by question types if specified
          const filteredQuestions = segmentQuestions.filter(q => 
            questionTypes.includes(q.type)
          );

          allQuestions.push(...filteredQuestions);
          totalConfidence += filteredQuestions.reduce((sum, q) => sum + q.confidence, 0);

        } catch (error) {
          console.warn('Error generating questions for segment:', error);
        }
      }

      // Sort by confidence and take the best questions
      allQuestions.sort((a, b) => b.confidence - a.confidence);
      const finalQuestions = allQuestions.slice(0, numQuestions);

      // Generate multiple choice options for each question
      const questionsWithOptions = await this.generateMultipleChoiceOptions(finalQuestions, extractedText);

      const result: PDFQuestionResult = {
        questions: questionsWithOptions,
        context: extractedText,
        metadata: {
          processingTime: Date.now() - startTime,
          textLength: extractedText.length,
          segmentCount: segments.length,
          modelConfidence: totalConfidence / Math.max(allQuestions.length, 1)
        }
      };

      // Cache the result
      if (useCache) {
        this.cache.set(cacheKey, result);
      }

      console.log(`Generated ${finalQuestions.length} questions in ${result.metadata.processingTime}ms`);
      return result;

    } catch (error) {
      console.error('Error processing PDF:', error);
      throw error;
    }
  }

  /**
   * Segment text into logical chunks for processing
   */
  segmentText(text: string): TextSegment[] {
    const segments: TextSegment[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    let currentSegment = '';
    let startPosition = 0;
    const maxSegmentLength = 800;
    const minSegmentLength = 200;

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      
      if (currentSegment.length + trimmedSentence.length > maxSegmentLength && currentSegment.length > minSegmentLength) {
        // Create segment
        const importance = this.calculateSegmentImportance(currentSegment);
        segments.push({
          text: currentSegment.trim(),
          startPosition,
          endPosition: startPosition + currentSegment.length,
          importance
        });
        
        startPosition += currentSegment.length;
        currentSegment = trimmedSentence + '.';
      } else {
        currentSegment += ' ' + trimmedSentence + '.';
      }
    }

    // Add final segment if it exists
    if (currentSegment.trim().length > minSegmentLength) {
      const importance = this.calculateSegmentImportance(currentSegment);
      segments.push({
        text: currentSegment.trim(),
        startPosition,
        endPosition: startPosition + currentSegment.length,
        importance
      });
    }

    // Sort by importance and return top segments
    segments.sort((a, b) => b.importance - a.importance);
    return segments.slice(0, 5); // Process top 5 most important segments
  }

  /**
   * Calculate the importance score of a text segment
   */
  private calculateSegmentImportance(text: string): number {
    let score = 0;
    const lowerText = text.toLowerCase();

    // Technical terms and keywords increase importance
    const importantTerms = [
      'definition', 'process', 'method', 'principle', 'concept', 'theory',
      'algorithm', 'system', 'structure', 'function', 'analysis', 'design',
      'development', 'implementation', 'application', 'result', 'conclusion'
    ];

    importantTerms.forEach(term => {
      const matches = (lowerText.match(new RegExp(term, 'g')) || []).length;
      score += matches * 2;
    });

    // Presence of numbers and measurements
    const numbers = (text.match(/\d+/g) || []).length;
    score += numbers;

    // Question-worthy sentence patterns
    if (lowerText.includes('is defined as') || lowerText.includes('refers to')) score += 5;
    if (lowerText.includes('consists of') || lowerText.includes('includes')) score += 3;
    if (lowerText.includes('because') || lowerText.includes('therefore')) score += 3;

    // Length factor (prefer moderately long segments)
    const lengthScore = Math.max(0, Math.min(5, text.length / 100));
    score += lengthScore;

    return score;
  }

  /**
   * Generate multiple choice options for questions
   */
  private async generateMultipleChoiceOptions(questions: Question[], context: string): Promise<Question[]> {
    const questionsWithOptions: Question[] = [];

    for (const question of questions) {
      try {
        const options = await this.generateOptionsForQuestion(question, context);
        questionsWithOptions.push({
          ...question,
          options,
          correct: 0 // Correct answer is always first, will be shuffled in UI
        });
      } catch (error) {
        console.warn('Error generating options for question:', error);
        // Add question without options as fallback
        questionsWithOptions.push(question);
      }
    }

    return questionsWithOptions;
  }

  /**
   * Generate distractors for a specific question
   */
  private async generateOptionsForQuestion(question: Question, context: string): Promise<string[]> {
    // This is a simplified implementation
    // In practice, you could use another model or more sophisticated techniques
    
    const baseAnswer = this.extractAnswerFromContext(question.question, context);
    const options = [baseAnswer];

    // Generate 3 distractors based on question type
    switch (question.type) {
      case 'definition':
        options.push(
          this.generateDefinitionDistractor(baseAnswer),
          this.generateDefinitionDistractor(baseAnswer, 'opposite'),
          this.generateDefinitionDistractor(baseAnswer, 'related')
        );
        break;
        
      case 'factual':
        options.push(
          this.generateFactualDistractor(baseAnswer),
          this.generateFactualDistractor(baseAnswer, 'number'),
          this.generateFactualDistractor(baseAnswer, 'category')
        );
        break;
        
      case 'conceptual':
        options.push(
          this.generateConceptualDistractor(baseAnswer),
          this.generateConceptualDistractor(baseAnswer, 'process'),
          this.generateConceptualDistractor(baseAnswer, 'relationship')
        );
        break;
        
      default:
        options.push(
          'Alternative option A',
          'Alternative option B', 
          'Alternative option C'
        );
    }

    return options;
  }

  /**
   * Extract answer from context based on question
   */
  private extractAnswerFromContext(question: string, context: string): string {
    // Simplified answer extraction
    const sentences = context.split(/[.!?]+/);
    const questionWords = question.toLowerCase().split(' ');
    
    let bestSentence = '';
    let bestScore = 0;

    for (const sentence of sentences) {
      if (sentence.length < 20) continue;
      
      let score = 0;
      const sentenceWords = sentence.toLowerCase().split(' ');
      
      questionWords.forEach(word => {
        if (word.length > 3 && sentenceWords.includes(word)) {
          score++;
        }
      });
      
      if (score > bestScore) {
        bestScore = score;
        bestSentence = sentence.trim();
      }
    }

    return bestSentence || 'Answer not found in context';
  }

  /**
   * Generate distractors for definition questions
   */
  private generateDefinitionDistractor(answer: string, type: string = 'similar'): string {
    const words = answer.split(' ');
    
    switch (type) {
      case 'opposite':
        return words.map(word => this.getOppositeWord(word)).join(' ');
      case 'related':
        return words.map(word => this.getRelatedWord(word)).join(' ');
      default:
        return words.map(word => this.getSimilarWord(word)).join(' ');
    }
  }

  /**
   * Generate distractors for factual questions
   */
  private generateFactualDistractor(answer: string, type: string = 'similar'): string {
    if (type === 'number') {
      return answer.replace(/\d+/g, (match) => {
        const num = parseInt(match);
        return (num + Math.floor(Math.random() * 10) + 1).toString();
      });
    }
    
    return this.generateDefinitionDistractor(answer, type);
  }

  /**
   * Generate distractors for conceptual questions
   */
  private generateConceptualDistractor(answer: string, type: string = 'similar'): string {
    return this.generateDefinitionDistractor(answer, type);
  }

  /**
   * Helper methods for word replacement in distractors
   */
  private getOppositeWord(word: string): string {
    const opposites: { [key: string]: string } = {
      'increase': 'decrease',
      'large': 'small',
      'fast': 'slow',
      'hot': 'cold',
      'good': 'bad',
      'high': 'low',
      'strong': 'weak'
    };
    return opposites[word.toLowerCase()] || word;
  }

  private getRelatedWord(word: string): string {
    const related: { [key: string]: string } = {
      'computer': 'machine',
      'software': 'program',
      'data': 'information',
      'process': 'procedure',
      'system': 'network'
    };
    return related[word.toLowerCase()] || word;
  }

  private getSimilarWord(word: string): string {
    const similar: { [key: string]: string } = {
      'important': 'significant',
      'create': 'generate',
      'use': 'utilize',
      'show': 'display',
      'make': 'produce'
    };
    return similar[word.toLowerCase()] || word;
  }

  /**
   * Fine-tune the model with user feedback
   */
  async fineTuneWithFeedback(feedbackData: TrainingData[]): Promise<void> {
    console.log('Fine-tuning model with user feedback...');
    await this.trainer.fineTune(feedbackData);
    await this.questionGenerator.saveModel('./models/trained');
    console.log('Model fine-tuning completed');
  }

  /**
   * Get system statistics
   */
  getSystemStats(): any {
    return {
      isInitialized: this.isInitialized,
      cacheSize: this.cache.size,
      modelStats: this.trainer.exportTrainingStats()
    };
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('Cache cleared');
  }
}
