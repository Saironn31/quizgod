/**
 * Custom-Trained Question Generator Model
 * Full transformer architecture for PDF question generation
 * Based on DeepSeek's specifications
 */

import * as tf from '@tensorflow/tfjs';

export interface Question {
  question: string;
  type: 'definition' | 'factual' | 'conceptual' | 'analytical' | 'application';
  confidence: number;
  context: string;
  options?: string[];
  correct?: number;
}

export interface ModelConfig {
  vocabularySize: number;
  embeddingDim: number;
  numHeads: number;
  numLayers: number;
  maxSequenceLength: number;
  dropoutRate: number;
}

export class QuestionGeneratorModel {
  private encoder: tf.LayersModel | null = null;
  private decoder: tf.LayersModel | null = null;
  private qualityPredictor: tf.LayersModel | null = null;
  private tokenizer: Map<string, number> = new Map();
  private reverseTokenizer: Map<number, string> = new Map();
  private config: ModelConfig;

  constructor(config?: Partial<ModelConfig>) {
    this.config = {
      vocabularySize: 30000,
      embeddingDim: 512,
      numHeads: 8,
      numLayers: 6,
      maxSequenceLength: 512,
      dropoutRate: 0.1,
      ...config
    };
    
    this.initializeTokenizer();
  }

  /**
   * Build BERT-style encoder for context understanding
   */
  buildEncoder(): tf.LayersModel {
    console.log('Building encoder with config:', this.config);
    
    const input = tf.input({ shape: [this.config.maxSequenceLength] });
    
    // Embedding layer
    const embedding = tf.layers.embedding({
      inputDim: this.config.vocabularySize,
      outputDim: this.config.embeddingDim,
      maskZero: true,
      name: 'encoder_embedding'
    }).apply(input) as tf.SymbolicTensor;
    
    // Positional encoding
    const positionalEncoding = tf.layers.dense({
      units: this.config.embeddingDim,
      activation: 'linear',
      name: 'positional_encoding'
    }).apply(embedding) as tf.SymbolicTensor;
    
    let x = tf.layers.add().apply([embedding, positionalEncoding]) as tf.SymbolicTensor;
    
    // Multi-layer transformer encoder
    for (let i = 0; i < this.config.numLayers; i++) {
      // Multi-head attention
      const attention = tf.layers.multiHeadAttention({
        numHeads: this.config.numHeads,
        keyDim: this.config.embeddingDim / this.config.numHeads,
        dropout: this.config.dropoutRate,
        name: `encoder_attention_${i}`
      }).apply([x, x]) as tf.SymbolicTensor;
      
      // Add & Norm
      const addNorm1 = tf.layers.layerNormalization({
        name: `encoder_norm1_${i}`
      }).apply(tf.layers.add().apply([x, attention])) as tf.SymbolicTensor;
      
      // Feed forward
      const ff1 = tf.layers.dense({
        units: this.config.embeddingDim * 4,
        activation: 'relu',
        name: `encoder_ff1_${i}`
      }).apply(addNorm1) as tf.SymbolicTensor;
      
      const ff2 = tf.layers.dense({
        units: this.config.embeddingDim,
        name: `encoder_ff2_${i}`
      }).apply(ff1) as tf.SymbolicTensor;
      
      const dropout = tf.layers.dropout({
        rate: this.config.dropoutRate,
        name: `encoder_dropout_${i}`
      }).apply(ff2) as tf.SymbolicTensor;
      
      // Add & Norm
      x = tf.layers.layerNormalization({
        name: `encoder_norm2_${i}`
      }).apply(tf.layers.add().apply([addNorm1, dropout])) as tf.SymbolicTensor;
    }
    
    const model = tf.model({ inputs: input, outputs: x, name: 'encoder' });
    
    // Compile the model
    model.compile({
      optimizer: tf.train.adam(0.0001),
      loss: 'meanSquaredError',
      metrics: ['accuracy']
    });
    
    return model;
  }

  /**
   * Build GPT-style decoder for question generation
   */
  buildDecoder(): tf.LayersModel {
    console.log('Building decoder with config:', this.config);
    
    const encoderOutput = tf.input({ 
      shape: [this.config.maxSequenceLength, this.config.embeddingDim],
      name: 'encoder_output'
    });
    
    const decoderInput = tf.input({ 
      shape: [null], // Variable length
      name: 'decoder_input'
    });
    
    // Embedding layer for decoder
    const embedding = tf.layers.embedding({
      inputDim: this.config.vocabularySize,
      outputDim: this.config.embeddingDim,
      maskZero: true,
      name: 'decoder_embedding'
    }).apply(decoderInput) as tf.SymbolicTensor;
    
    // Positional encoding for decoder
    const positionalEncoding = tf.layers.dense({
      units: this.config.embeddingDim,
      activation: 'linear',
      name: 'decoder_positional_encoding'
    }).apply(embedding) as tf.SymbolicTensor;
    
    let x = tf.layers.add().apply([embedding, positionalEncoding]) as tf.SymbolicTensor;
    
    // Multi-layer transformer decoder
    for (let i = 0; i < this.config.numLayers; i++) {
      // Masked self-attention (causal)
      const selfAttention = tf.layers.multiHeadAttention({
        numHeads: this.config.numHeads,
        keyDim: this.config.embeddingDim / this.config.numHeads,
        dropout: this.config.dropoutRate,
        useCausalMask: true,
        name: `decoder_self_attention_${i}`
      }).apply([x, x]) as tf.SymbolicTensor;
      
      const addNorm1 = tf.layers.layerNormalization({
        name: `decoder_norm1_${i}`
      }).apply(tf.layers.add().apply([x, selfAttention])) as tf.SymbolicTensor;
      
      // Cross-attention with encoder output
      const crossAttention = tf.layers.multiHeadAttention({
        numHeads: this.config.numHeads,
        keyDim: this.config.embeddingDim / this.config.numHeads,
        dropout: this.config.dropoutRate,
        name: `decoder_cross_attention_${i}`
      }).apply([addNorm1, encoderOutput]) as tf.SymbolicTensor;
      
      const addNorm2 = tf.layers.layerNormalization({
        name: `decoder_norm2_${i}`
      }).apply(tf.layers.add().apply([addNorm1, crossAttention])) as tf.SymbolicTensor;
      
      // Feed forward
      const ff1 = tf.layers.dense({
        units: this.config.embeddingDim * 4,
        activation: 'relu',
        name: `decoder_ff1_${i}`
      }).apply(addNorm2) as tf.SymbolicTensor;
      
      const ff2 = tf.layers.dense({
        units: this.config.embeddingDim,
        name: `decoder_ff2_${i}`
      }).apply(ff1) as tf.SymbolicTensor;
      
      const dropout = tf.layers.dropout({
        rate: this.config.dropoutRate,
        name: `decoder_dropout_${i}`
      }).apply(ff2) as tf.SymbolicTensor;
      
      x = tf.layers.layerNormalization({
        name: `decoder_norm3_${i}`
      }).apply(tf.layers.add().apply([addNorm2, dropout])) as tf.SymbolicTensor;
    }
    
    // Output projection to vocabulary
    const output = tf.layers.dense({
      units: this.config.vocabularySize,
      activation: 'softmax',
      name: 'output_projection'
    }).apply(x) as tf.SymbolicTensor;
    
    const model = tf.model({ 
      inputs: [encoderOutput, decoderInput], 
      outputs: output, 
      name: 'decoder' 
    });
    
    // Compile the model
    model.compile({
      optimizer: tf.train.adam(0.0001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });
    
    return model;
  }

  /**
   * Build quality predictor network
   */
  buildQualityPredictor(): tf.LayersModel {
    console.log('Building quality predictor...');
    
    const input = tf.input({ shape: [this.config.embeddingDim] });
    
    const dense1 = tf.layers.dense({
      units: 256,
      activation: 'relu',
      name: 'quality_dense1'
    }).apply(input) as tf.SymbolicTensor;
    
    const dropout1 = tf.layers.dropout({
      rate: 0.3,
      name: 'quality_dropout1'
    }).apply(dense1) as tf.SymbolicTensor;
    
    const dense2 = tf.layers.dense({
      units: 128,
      activation: 'relu',
      name: 'quality_dense2'
    }).apply(dropout1) as tf.SymbolicTensor;
    
    const dropout2 = tf.layers.dropout({
      rate: 0.3,
      name: 'quality_dropout2'
    }).apply(dense2) as tf.SymbolicTensor;
    
    const dense3 = tf.layers.dense({
      units: 64,
      activation: 'relu',
      name: 'quality_dense3'
    }).apply(dropout2) as tf.SymbolicTensor;
    
    const output = tf.layers.dense({
      units: 1,
      activation: 'sigmoid',
      name: 'quality_output'
    }).apply(dense3) as tf.SymbolicTensor;
    
    const model = tf.model({ inputs: input, outputs: output, name: 'quality_predictor' });
    
    // Compile the model
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });
    
    return model;
  }

  /**
   * Initialize the complete model architecture
   */
  async initialize(): Promise<void> {
    console.log('Initializing Question Generator Model...');
    
    this.encoder = this.buildEncoder();
    this.decoder = this.buildDecoder();
    this.qualityPredictor = this.buildQualityPredictor();
    
    console.log('Model architecture initialized:');
    console.log('Encoder parameters:', this.encoder.countParams());
    console.log('Decoder parameters:', this.decoder.countParams());
    console.log('Quality predictor parameters:', this.qualityPredictor.countParams());
  }

  /**
   * Initialize tokenizer with common vocabulary
   */
  private initializeTokenizer(): void {
    // Common words and question patterns
    const vocabulary = [
      '<PAD>', '<UNK>', '<START>', '<END>',
      'what', 'which', 'how', 'where', 'when', 'why', 'who',
      'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then',
      'define', 'explain', 'describe', 'compare', 'analyze',
      'following', 'best', 'correct', 'true', 'false',
      'according', 'content', 'text', 'document', 'passage',
      // Add more vocabulary as needed
    ];
    
    // Create tokenizer mappings
    vocabulary.forEach((word, index) => {
      this.tokenizer.set(word, index);
      this.reverseTokenizer.set(index, word);
    });
  }

  /**
   * Tokenize text input
   */
  tokenize(text: string): number[] {
    const words = text.toLowerCase().split(/\s+/);
    const tokens: number[] = [];
    
    for (const word of words) {
      const token = this.tokenizer.get(word) || this.tokenizer.get('<UNK>') || 1;
      tokens.push(token);
    }
    
    // Pad or truncate to max length
    while (tokens.length < this.config.maxSequenceLength) {
      tokens.push(0); // PAD token
    }
    
    return tokens.slice(0, this.config.maxSequenceLength);
  }

  /**
   * Detokenize tokens back to text
   */
  detokenize(tokens: number[]): string {
    const words: string[] = [];
    
    for (const token of tokens) {
      if (token === 0) break; // Stop at PAD token
      const word = this.reverseTokenizer.get(token) || '<UNK>';
      if (word !== '<PAD>') {
        words.push(word);
      }
    }
    
    return words.join(' ');
  }

  /**
   * Generate questions from context using the trained model
   */
  async generateQuestions(context: string, numQuestions: number = 3): Promise<Question[]> {
    if (!this.encoder || !this.decoder || !this.qualityPredictor) {
      throw new Error('Model not initialized. Call initialize() first.');
    }

    console.log('Generating questions for context:', context.substring(0, 100) + '...');
    
    // Tokenize and encode context
    const contextTokens = this.tokenize(context);
    const contextTensor = tf.tensor2d([contextTokens]);
    
    // Encode context
    const encodedContext = this.encoder.predict(contextTensor) as tf.Tensor;
    
    const questions: Question[] = [];
    
    // Generate multiple questions
    for (let i = 0; i < numQuestions; i++) {
      try {
        const question = await this.generateSingleQuestion(encodedContext, context);
        
        if (question) {
          // Predict quality score
          const questionEmbedding = await this.getQuestionEmbedding(question.question);
          const qualityScore = this.qualityPredictor.predict(questionEmbedding) as tf.Tensor;
          const score = await qualityScore.data();
          
          question.confidence = score[0];
          
          // Only include high-quality questions
          if (question.confidence > 0.6) {
            questions.push(question);
          }
        }
      } catch (error) {
        console.warn('Error generating question:', error);
      }
    }
    
    // Clean up tensors
    contextTensor.dispose();
    encodedContext.dispose();
    
    console.log(`Generated ${questions.length} high-quality questions`);
    return questions;
  }

  /**
   * Generate a single question using the decoder
   */
  private async generateSingleQuestion(encodedContext: tf.Tensor, originalContext: string): Promise<Question | null> {
    // Start with <START> token
    const startToken = this.tokenizer.get('<START>') || 2;
    let currentTokens = [startToken];
    const maxLength = 50; // Max question length
    
    // Generate question token by token
    for (let i = 0; i < maxLength; i++) {
      const decoderInput = tf.tensor2d([currentTokens]);
      
      try {
        const prediction = this.decoder!.predict([encodedContext, decoderInput]) as tf.Tensor;
        const probabilities = await prediction.data();
        
        // Sample next token (you could use beam search here for better results)
        const nextToken = this.sampleToken(probabilities, currentTokens.length - 1);
        
        if (nextToken === this.tokenizer.get('<END>') || nextToken === 0) {
          break;
        }
        
        currentTokens.push(nextToken);
        
        decoderInput.dispose();
        prediction.dispose();
      } catch (error) {
        console.warn('Error in token generation:', error);
        break;
      }
    }
    
    // Convert tokens to question text
    const questionText = this.detokenize(currentTokens.slice(1)); // Remove <START> token
    
    if (questionText.length > 10) {
      // Determine question type based on content
      const questionType = this.classifyQuestionType(questionText);
      
      return {
        question: this.formatQuestion(questionText),
        type: questionType,
        confidence: 0.5, // Will be updated by quality predictor
        context: originalContext
      };
    }
    
    return null;
  }

  /**
   * Sample next token from probability distribution
   */
  private sampleToken(probabilities: Float32Array, position: number): number {
    // Get probabilities for the current position
    const vocabSize = this.config.vocabularySize;
    const startIdx = position * vocabSize;
    const endIdx = startIdx + vocabSize;
    const tokenProbs = probabilities.slice(startIdx, endIdx);
    
    // Sample using temperature (optional: implement temperature sampling)
    let maxProb = -1;
    let bestToken = 0;
    
    for (let i = 0; i < tokenProbs.length; i++) {
      if (tokenProbs[i] > maxProb) {
        maxProb = tokenProbs[i];
        bestToken = i;
      }
    }
    
    return bestToken;
  }

  /**
   * Get embedding representation of a question for quality prediction
   */
  private async getQuestionEmbedding(question: string): Promise<tf.Tensor> {
    const tokens = this.tokenize(question);
    const tokenTensor = tf.tensor2d([tokens]);
    
    // Use encoder to get embedding
    const embedding = this.encoder!.predict(tokenTensor) as tf.Tensor;
    
    // Global average pooling to get fixed-size representation
    const avgEmbedding = tf.mean(embedding, 1);
    
    tokenTensor.dispose();
    embedding.dispose();
    
    return avgEmbedding;
  }

  /**
   * Classify question type based on content
   */
  private classifyQuestionType(question: string): Question['type'] {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('what is') || lowerQuestion.includes('define')) {
      return 'definition';
    } else if (lowerQuestion.includes('how') || lowerQuestion.includes('process')) {
      return 'conceptual';
    } else if (lowerQuestion.includes('analyze') || lowerQuestion.includes('compare')) {
      return 'analytical';
    } else if (lowerQuestion.includes('apply') || lowerQuestion.includes('use')) {
      return 'application';
    } else {
      return 'factual';
    }
  }

  /**
   * Format question text properly
   */
  private formatQuestion(question: string): string {
    // Capitalize first letter
    question = question.charAt(0).toUpperCase() + question.slice(1);
    
    // Ensure question ends with question mark
    if (!question.endsWith('?')) {
      question += '?';
    }
    
    return question.trim();
  }

  /**
   * Save the trained model
   */
  async saveModel(path: string): Promise<void> {
    if (!this.encoder || !this.decoder || !this.qualityPredictor) {
      throw new Error('Model not initialized');
    }

    await this.encoder.save(`${path}/encoder`);
    await this.decoder.save(`${path}/decoder`);
    await this.qualityPredictor.save(`${path}/quality_predictor`);
    
    console.log('Model saved successfully to:', path);
  }

  /**
   * Load a pre-trained model
   */
  async loadModel(path: string): Promise<void> {
    try {
      this.encoder = await tf.loadLayersModel(`${path}/encoder/model.json`);
      this.decoder = await tf.loadLayersModel(`${path}/decoder/model.json`);
      this.qualityPredictor = await tf.loadLayersModel(`${path}/quality_predictor/model.json`);
      
      console.log('Model loaded successfully from:', path);
    } catch (error) {
      console.warn('Could not load pre-trained model, using initialized model:', error);
      await this.initialize();
    }
  }
}
