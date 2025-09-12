/**
 * Model Trainer for Custom Question Generator
 * Implements training pipeline for the transformer-based model
 */

import * as tf from '@tensorflow/tfjs';
import { QuestionGeneratorModel, Question } from './QuestionGeneratorModel';

export interface TrainingData {
  context: string;
  questions: {
    question: string;
    type: string;
    answer: string;
  }[];
}

export interface TrainingConfig {
  epochs: number;
  batchSize: number;
  learningRate: number;
  validationSplit: number;
  saveCheckpoints: boolean;
  checkpointFrequency: number;
}

export class ModelTrainer {
  private model: QuestionGeneratorModel;
  private trainingData: TrainingData[] = [];
  private config: TrainingConfig;

  constructor(model: QuestionGeneratorModel, config?: Partial<TrainingConfig>) {
    this.model = model;
    this.config = {
      epochs: 100,
      batchSize: 16,
      learningRate: 0.0001,
      validationSplit: 0.2,
      saveCheckpoints: true,
      checkpointFrequency: 10,
      ...config
    };
  }

  /**
   * Load training data from various sources
   */
  async loadTrainingData(data: TrainingData[]): Promise<void> {
    this.trainingData = data;
    console.log(`Loaded ${this.trainingData.length} training examples`);
  }

  /**
   * Generate synthetic training data for bootstrapping
   */
  generateSyntheticData(): TrainingData[] {
    const syntheticData: TrainingData[] = [
      {
        context: "Photosynthesis is the process by which plants convert light energy, usually from the sun, into chemical energy that can be later released to fuel the organism's activities.",
        questions: [
          {
            question: "What is photosynthesis?",
            type: "definition",
            answer: "The process by which plants convert light energy into chemical energy"
          },
          {
            question: "What type of energy do plants convert during photosynthesis?",
            type: "factual",
            answer: "Light energy, usually from the sun"
          },
          {
            question: "How do plants use the chemical energy produced by photosynthesis?",
            type: "conceptual",
            answer: "To fuel the organism's activities"
          }
        ]
      },
      {
        context: "Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed. It focuses on developing algorithms that can access data and use it to learn for themselves.",
        questions: [
          {
            question: "What is machine learning?",
            type: "definition",
            answer: "A subset of artificial intelligence that enables computers to learn from experience without explicit programming"
          },
          {
            question: "What do machine learning algorithms use to learn?",
            type: "factual",
            answer: "Data"
          },
          {
            question: "How does machine learning differ from traditional programming?",
            type: "analytical",
            answer: "It learns from experience without being explicitly programmed"
          }
        ]
      },
      {
        context: "The water cycle is the continuous movement of water within the Earth and atmosphere. It is a complex system that includes many different processes. Liquid water evaporates into water vapor, condenses to form clouds, and precipitates back to earth in the form of rain and snow.",
        questions: [
          {
            question: "What is the water cycle?",
            type: "definition",
            answer: "The continuous movement of water within the Earth and atmosphere"
          },
          {
            question: "What happens when liquid water evaporates?",
            type: "factual",
            answer: "It becomes water vapor"
          },
          {
            question: "Describe the process of how clouds form and produce precipitation.",
            type: "conceptual",
            answer: "Water vapor condenses to form clouds, then precipitates as rain and snow"
          }
        ]
      },
      {
        context: "DNA, or deoxyribonucleic acid, is the hereditary material in humans and almost all other organisms. Nearly every cell in a person's body has the same DNA. Most DNA is located in the cell nucleus, but a small amount can also be found in the mitochondria.",
        questions: [
          {
            question: "What does DNA stand for?",
            type: "factual",
            answer: "Deoxyribonucleic acid"
          },
          {
            question: "What is DNA?",
            type: "definition",
            answer: "The hereditary material in humans and almost all other organisms"
          },
          {
            question: "Where is most DNA located in a cell?",
            type: "factual",
            answer: "In the cell nucleus"
          }
        ]
      },
      {
        context: "Gravity is a fundamental force of physics that causes objects with mass to attract each other. The strength of gravitational attraction depends on the masses of the objects and the distance between them. This force keeps planets in orbit around stars and governs the motion of galaxies.",
        questions: [
          {
            question: "What is gravity?",
            type: "definition",
            answer: "A fundamental force that causes objects with mass to attract each other"
          },
          {
            question: "What factors affect the strength of gravitational attraction?",
            type: "factual",
            answer: "The masses of the objects and the distance between them"
          },
          {
            question: "How does gravity affect celestial bodies?",
            type: "application",
            answer: "It keeps planets in orbit around stars and governs galactic motion"
          }
        ]
      }
    ];

    console.log('Generated synthetic training data:', syntheticData.length, 'examples');
    return syntheticData;
  }

  /**
   * Prepare training data for the model
   */
  prepareTrainingData(data: TrainingData[]): { inputs: tf.Tensor[], labels: tf.Tensor[] } {
    const contextInputs: number[][] = [];
    const questionInputs: number[][] = [];
    const questionLabels: number[][] = [];
    const qualityLabels: number[] = [];

    for (const item of data) {
      const contextTokens = this.model.tokenize(item.context);
      
      for (const q of item.questions) {
        // Tokenize question for training
        const questionTokens = this.model.tokenize(q.question);
        
        // Create input (without last token) and label (without first token)
        const questionInput = [2, ...questionTokens.slice(0, -1)]; // Add START token
        const questionLabel = [...questionTokens.slice(1), 3]; // Add END token
        
        contextInputs.push(contextTokens);
        questionInputs.push(questionInput);
        questionLabels.push(questionLabel);
        qualityLabels.push(1.0); // Assume all training questions are high quality
      }
    }

    return {
      inputs: [
        tf.tensor2d(contextInputs),
        tf.tensor2d(questionInputs)
      ],
      labels: [
        tf.tensor2d(questionLabels),
        tf.tensor2d(qualityLabels.map(q => [q]))
      ]
    };
  }

  /**
   * Train the question generator model
   */
  async trainQuestionGenerator(trainingData?: TrainingData[]): Promise<void> {
    console.log('Starting model training...');
    
    // Use provided data or generate synthetic data
    const data = trainingData || this.trainingData.length > 0 ? this.trainingData : this.generateSyntheticData();
    
    if (data.length === 0) {
      throw new Error('No training data available');
    }

    // Initialize model if not already done
    if (!this.model.encoder) {
      await this.model.initialize();
    }

    // Prepare training data
    const { inputs, labels } = this.prepareTrainingData(data);
    console.log('Training data prepared:', inputs.length, 'input tensors');

    // Create combined model for training
    const combinedModel = this.createCombinedModel();

    // Training loop
    for (let epoch = 0; epoch < this.config.epochs; epoch++) {
      console.log(`\n=== Epoch ${epoch + 1}/${this.config.epochs} ===`);
      
      try {
        const history = await combinedModel.fit(inputs, labels, {
          epochs: 1,
          batchSize: this.config.batchSize,
          validationSplit: this.config.validationSplit,
          shuffle: true,
          callbacks: {
            onBatchEnd: (batch, logs) => {
              if (batch % 10 === 0) {
                console.log(`Batch ${batch}: Loss = ${logs?.loss?.toFixed(4)}, Accuracy = ${logs?.accuracy?.toFixed(4)}`);
              }
            },
            onEpochEnd: (epoch, logs) => {
              console.log(`Epoch ${epoch + 1} completed:`);
              console.log(`  Training Loss: ${logs?.loss?.toFixed(4)}`);
              console.log(`  Training Accuracy: ${logs?.accuracy?.toFixed(4)}`);
              console.log(`  Validation Loss: ${logs?.val_loss?.toFixed(4)}`);
              console.log(`  Validation Accuracy: ${logs?.val_accuracy?.toFixed(4)}`);
            }
          }
        });

        // Save checkpoint
        if (this.config.saveCheckpoints && epoch % this.config.checkpointFrequency === 0) {
          await this.saveCheckpoint(epoch);
        }

        // Early stopping based on validation loss
        if (history.history.val_loss && history.history.val_loss[0] < 0.1) {
          console.log('Early stopping: Validation loss threshold reached');
          break;
        }

      } catch (error) {
        console.error(`Error in epoch ${epoch + 1}:`, error);
        // Continue training despite errors
      }
    }

    // Clean up tensors
    inputs.forEach(tensor => tensor.dispose());
    labels.forEach(tensor => tensor.dispose());

    console.log('Training completed!');
  }

  /**
   * Create a combined model for training
   */
  private createCombinedModel(): tf.LayersModel {
    // This is a simplified version - in practice, you'd need to handle the encoder-decoder architecture more carefully
    
    const contextInput = tf.input({ shape: [512], name: 'context_input' });
    const questionInput = tf.input({ shape: [null], name: 'question_input' });
    
    // Encode context
    const encodedContext = this.model.encoder!.apply(contextInput) as tf.SymbolicTensor;
    
    // Decode question
    const decodedQuestion = this.model.decoder!.apply([encodedContext, questionInput]) as tf.SymbolicTensor;
    
    // Quality prediction
    const questionEmbedding = tf.layers.globalAveragePooling1d().apply(encodedContext) as tf.SymbolicTensor;
    const qualityScore = this.model.qualityPredictor!.apply(questionEmbedding) as tf.SymbolicTensor;
    
    const combinedModel = tf.model({
      inputs: [contextInput, questionInput],
      outputs: [decodedQuestion, qualityScore],
      name: 'combined_training_model'
    });

    // Compile with multiple losses
    combinedModel.compile({
      optimizer: tf.train.adam(this.config.learningRate),
      loss: ['categoricalCrossentropy', 'binaryCrossentropy'],
      lossWeights: [1.0, 0.1], // Weight the question generation loss more heavily
      metrics: ['accuracy']
    });

    return combinedModel;
  }

  /**
   * Save training checkpoint
   */
  private async saveCheckpoint(epoch: number): Promise<void> {
    const checkpointPath = `./models/checkpoints/epoch_${epoch}`;
    try {
      await this.model.saveModel(checkpointPath);
      console.log(`Checkpoint saved at epoch ${epoch}`);
    } catch (error) {
      console.warn('Failed to save checkpoint:', error);
    }
  }

  /**
   * Evaluate model performance
   */
  async evaluateModel(testData: TrainingData[]): Promise<{ accuracy: number; averageQuality: number }> {
    console.log('Evaluating model performance...');
    
    let totalQuestions = 0;
    let correctQuestions = 0;
    let totalQuality = 0;

    for (const item of testData) {
      try {
        const generatedQuestions = await this.model.generateQuestions(item.context, item.questions.length);
        
        for (let i = 0; i < Math.min(generatedQuestions.length, item.questions.length); i++) {
          totalQuestions++;
          totalQuality += generatedQuestions[i].confidence;
          
          // Simple similarity check (in practice, you'd use more sophisticated metrics)
          const similarity = this.calculateSimilarity(
            generatedQuestions[i].question, 
            item.questions[i].question
          );
          
          if (similarity > 0.5) {
            correctQuestions++;
          }
        }
      } catch (error) {
        console.warn('Error evaluating item:', error);
      }
    }

    const accuracy = totalQuestions > 0 ? correctQuestions / totalQuestions : 0;
    const averageQuality = totalQuestions > 0 ? totalQuality / totalQuestions : 0;

    console.log(`Evaluation Results:`);
    console.log(`  Accuracy: ${(accuracy * 100).toFixed(2)}%`);
    console.log(`  Average Quality Score: ${averageQuality.toFixed(3)}`);

    return { accuracy, averageQuality };
  }

  /**
   * Calculate similarity between two questions (simplified)
   */
  private calculateSimilarity(q1: string, q2: string): number {
    const words1 = new Set(q1.toLowerCase().split(/\s+/));
    const words2 = new Set(q2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Fine-tune model with domain-specific data
   */
  async fineTune(domainData: TrainingData[], epochs: number = 20): Promise<void> {
    console.log('Starting domain-specific fine-tuning...');
    
    // Use lower learning rate for fine-tuning
    const originalConfig = { ...this.config };
    this.config.epochs = epochs;
    this.config.learningRate = this.config.learningRate * 0.1;
    
    await this.trainQuestionGenerator(domainData);
    
    // Restore original config
    this.config = originalConfig;
    
    console.log('Fine-tuning completed!');
  }

  /**
   * Export training statistics
   */
  exportTrainingStats(): any {
    return {
      trainingDataSize: this.trainingData.length,
      config: this.config,
      modelParams: {
        encoder: this.model.encoder?.countParams() || 0,
        decoder: this.model.decoder?.countParams() || 0,
        qualityPredictor: this.model.qualityPredictor?.countParams() || 0
      }
    };
  }
}
