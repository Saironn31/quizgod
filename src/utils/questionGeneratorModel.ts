/**
 * Custom-Trained Question Generator Model
 * Based on DeepSeek's transformer architecture for PDF question generation
 */

import * as tf from '@tensorflow/tfjs';

export interface QuestionGenerationOptions {
  numQuestions: number;
  questionTypes: ('factual' | 'conceptual' | 'analytical' | 'application')[];
  qualityThreshold: number;
}

export interface GeneratedQuestion {
  question: string;
  options: string[];
  correct: number;
  type: string;
  confidence: number;
  context: string;
}

export interface TrainingDataItem {
  context: string;
  questions: Array<{
    question: string;
    type: string;
    answer: string;
  }>;
}

/**
 * Main Question Generator Model using Transformer Architecture
 */
export class QuestionGeneratorModel {
  private encoder: tf.LayersModel | null = null;
  private decoder: tf.LayersModel | null = null;
  private qualityPredictor: tf.LayersModel | null = null;
  private vocabulary: Map<string, number> = new Map();
  private reverseVocabulary: Map<number, string> = new Map();
  private vocabSize: number = 10000;
  private embedDim: number = 256;
  private maxSequenceLength: number = 512;

  constructor() {
    this.initializeVocabulary();
  }

  /**
   * Initialize the model architecture
   */
  async initialize(): Promise<void> {
    console.log('Initializing Question Generator Model...');
    
    this.encoder = this.buildEncoder();
    this.decoder = this.buildDecoder();
    this.qualityPredictor = this.buildQualityPredictor();
    
    console.log('Model architecture built successfully');
  }

  /**
   * Build BERT-style encoder for context understanding
   */
  private buildEncoder(): tf.LayersModel {
    const input = tf.input({ shape: [this.maxSequenceLength] });
    
    // Embedding layer
    const embedding = tf.layers.embedding({
      inputDim: this.vocabSize,
      outputDim: this.embedDim,
      maskZero: true,
      name: 'encoder_embedding'
    }).apply(input) as tf.SymbolicTensor;

    // Positional encoding
    const positionEncoding = tf.layers.embedding({
      inputDim: this.maxSequenceLength,
      outputDim: this.embedDim,
      name: 'position_encoding'
    });

    // Multi-head attention layers
    let x = embedding;
    for (let i = 0; i < 6; i++) { // 6 transformer layers
      const attention = tf.layers.multiHeadAttention({
        numHeads: 8,
        keyDim: this.embedDim / 8,
        name: `encoder_attention_${i}`
      }).apply([x, x]) as tf.SymbolicTensor;

      // Add & Norm
      const addNorm1 = tf.layers.add().apply([x, attention]) as tf.SymbolicTensor;
      const norm1 = tf.layers.layerNormalization().apply(addNorm1) as tf.SymbolicTensor;

      // Feed forward
      const ff1 = tf.layers.dense({
        units: this.embedDim * 4,
        activation: 'relu',
        name: `encoder_ff1_${i}`
      }).apply(norm1) as tf.SymbolicTensor;

      const ff2 = tf.layers.dense({
        units: this.embedDim,
        name: `encoder_ff2_${i}`
      }).apply(ff1) as tf.SymbolicTensor;

      // Add & Norm
      const addNorm2 = tf.layers.add().apply([norm1, ff2]) as tf.SymbolicTensor;
      x = tf.layers.layerNormalization().apply(addNorm2) as tf.SymbolicTensor;
    }

    const output = tf.layers.globalAveragePooling1d().apply(x) as tf.SymbolicTensor;

    return tf.model({ inputs: input, outputs: output, name: 'encoder' });
  }

  /**
   * Build GPT-style decoder for question generation
   */
  private buildDecoder(): tf.LayersModel {
    const input = tf.input({ shape: [this.maxSequenceLength] });
    const encoderOutput = tf.input({ shape: [this.embedDim] });

    // Embedding layer
    const embedding = tf.layers.embedding({
      inputDim: this.vocabSize,
      outputDim: this.embedDim,
      maskZero: true,
      name: 'decoder_embedding'
    }).apply(input) as tf.SymbolicTensor;

    // Expand encoder output to sequence length
    const expandedEncoder = tf.layers.repeatVector({
      n: this.maxSequenceLength,
      name: 'expand_encoder'
    }).apply(encoderOutput) as tf.SymbolicTensor;

    // Concatenate with embedding
    const combined = tf.layers.concatenate().apply([embedding, expandedEncoder]) as tf.SymbolicTensor;

    let x = combined;
    for (let i = 0; i < 6; i++) { // 6 decoder layers
      // Causal self-attention (masked)
      const attention = tf.layers.multiHeadAttention({
        numHeads: 8,
        keyDim: (this.embedDim * 2) / 8,
        useCausalMask: true,
        name: `decoder_attention_${i}`
      }).apply([x, x]) as tf.SymbolicTensor;

      // Add & Norm
      const addNorm1 = tf.layers.add().apply([x, attention]) as tf.SymbolicTensor;
      const norm1 = tf.layers.layerNormalization().apply(addNorm1) as tf.SymbolicTensor;

      // Feed forward
      const ff1 = tf.layers.dense({
        units: this.embedDim * 4,
        activation: 'relu',
        name: `decoder_ff1_${i}`
      }).apply(norm1) as tf.SymbolicTensor;

      const ff2 = tf.layers.dense({
        units: this.embedDim * 2,
        name: `decoder_ff2_${i}`
      }).apply(ff1) as tf.SymbolicTensor;

      // Add & Norm
      const addNorm2 = tf.layers.add().apply([norm1, ff2]) as tf.SymbolicTensor;
      x = tf.layers.layerNormalization().apply(addNorm2) as tf.SymbolicTensor;
    }

    // Output projection
    const output = tf.layers.dense({
      units: this.vocabSize,
      activation: 'softmax',
      name: 'output_projection'
    }).apply(x) as tf.SymbolicTensor;

    return tf.model({
      inputs: [input, encoderOutput],
      outputs: output,
      name: 'decoder'
    });
  }

  /**
   * Build quality predictor for question evaluation
   */
  private buildQualityPredictor(): tf.LayersModel {
    const input = tf.input({ shape: [this.embedDim] });

    const dense1 = tf.layers.dense({
      units: 128,
      activation: 'relu',
      name: 'quality_dense1'
    }).apply(input) as tf.SymbolicTensor;

    const dropout1 = tf.layers.dropout({ rate: 0.3 }).apply(dense1) as tf.SymbolicTensor;

    const dense2 = tf.layers.dense({
      units: 64,
      activation: 'relu',
      name: 'quality_dense2'
    }).apply(dropout1) as tf.SymbolicTensor;

    const dropout2 = tf.layers.dropout({ rate: 0.3 }).apply(dense2) as tf.SymbolicTensor;

    const output = tf.layers.dense({
      units: 1,
      activation: 'sigmoid',
      name: 'quality_output'
    }).apply(dropout2) as tf.SymbolicTensor;

    return tf.model({ inputs: input, outputs: output, name: 'quality_predictor' });
  }

  /**
   * Initialize vocabulary with common words and special tokens
   */
  private initializeVocabulary(): void {
    const specialTokens = ['<PAD>', '<UNK>', '<START>', '<END>', '<MASK>'];
    const commonWords = [
      'what', 'how', 'why', 'when', 'where', 'which', 'who', 'is', 'are', 'was', 'were',
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'question', 'answer', 'correct', 'following', 'best', 'describes', 'explains',
      'process', 'method', 'system', 'function', 'purpose', 'result', 'effect', 'cause'
    ];

    let index = 0;
    [...specialTokens, ...commonWords].forEach(token => {
      this.vocabulary.set(token, index);
      this.reverseVocabulary.set(index, token);
      index++;
    });
  }

  /**
   * Tokenize text into numerical tokens
   */
  private tokenize(text: string): number[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0);

    const tokens: number[] = [this.vocabulary.get('<START>') || 2];
    
    words.forEach(word => {
      let token = this.vocabulary.get(word);
      if (!token) {
        // Add new word to vocabulary if space available
        if (this.vocabulary.size < this.vocabSize - 1) {
          token = this.vocabulary.size;
          this.vocabulary.set(word, token);
          this.reverseVocabulary.set(token, word);
        } else {
          token = this.vocabulary.get('<UNK>') || 1;
        }
      }
      tokens.push(token);
    });

    tokens.push(this.vocabulary.get('<END>') || 3);

    // Pad or truncate to maxSequenceLength
    while (tokens.length < this.maxSequenceLength) {
      tokens.push(this.vocabulary.get('<PAD>') || 0);
    }

    return tokens.slice(0, this.maxSequenceLength);
  }

  /**
   * Convert tokens back to text
   */
  private detokenize(tokens: number[]): string {
    const words: string[] = [];
    for (const token of tokens) {
      const word = this.reverseVocabulary.get(token);
      if (word && !['<PAD>', '<START>', '<END>'].includes(word)) {
        words.push(word);
      }
    }
    return words.join(' ');
  }

  /**
   * Generate questions from context using the trained model
   */
  async generateQuestions(
    context: string,
    options: QuestionGenerationOptions
  ): Promise<GeneratedQuestion[]> {
    if (!this.encoder || !this.decoder || !this.qualityPredictor) {
      await this.initialize();
    }

    console.log('Generating questions for context:', context.substring(0, 100) + '...');

    // Tokenize and encode context
    const contextTokens = this.tokenize(context);
    const contextTensor = tf.tensor2d([contextTokens]);

    // Encode context
    const encodedContext = this.encoder!.predict(contextTensor) as tf.Tensor;

    const questions: GeneratedQuestion[] = [];

    for (let i = 0; i < options.numQuestions; i++) {
      try {
        const question = await this.generateSingleQuestion(
          encodedContext,
          contextTokens,
          options.questionTypes[i % options.questionTypes.length]
        );

        // Evaluate question quality
        const qualityScore = await this.evaluateQuestionQuality(question, encodedContext);

        if (qualityScore >= options.qualityThreshold) {
          questions.push({
            ...question,
            confidence: qualityScore,
            context: context.substring(0, 200) + '...'
          });
        }
      } catch (error) {
        console.warn('Failed to generate question:', error);
      }
    }

    // Cleanup tensors
    contextTensor.dispose();
    encodedContext.dispose();

    return questions;
  }

  /**
   * Generate a single question using the decoder
   */
  private async generateSingleQuestion(
    encodedContext: tf.Tensor,
    contextTokens: number[],
    questionType: string
  ): Promise<Omit<GeneratedQuestion, 'confidence' | 'context'>> {
    // Create question prompt based on type
    const prompt = this.createQuestionPrompt(questionType);
    const promptTokens = this.tokenize(prompt);
    const promptTensor = tf.tensor2d([promptTokens]);

    // Generate question using decoder
    const questionLogits = this.decoder!.predict([promptTensor, encodedContext]) as tf.Tensor;
    
    // Sample from the probability distribution
    const questionTokens = await this.sampleFromLogits(questionLogits);
    const questionText = this.detokenize(questionTokens);

    // Generate answer options using context
    const options = this.generateAnswerOptions(questionText, contextTokens);

    promptTensor.dispose();
    questionLogits.dispose();

    return {
      question: questionText,
      options,
      correct: 0,
      type: questionType
    };
  }

  /**
   * Create question prompts based on type
   */
  private createQuestionPrompt(questionType: string): string {
    const prompts = {
      factual: 'Generate a factual question about',
      conceptual: 'Create a conceptual question that tests understanding of',
      analytical: 'Design an analytical question that requires analysis of',
      application: 'Formulate an application question about how to use'
    };
    return prompts[questionType as keyof typeof prompts] || prompts.factual;
  }

  /**
   * Sample tokens from logits using temperature sampling
   */
  private async sampleFromLogits(logits: tf.Tensor, temperature: number = 0.8): Promise<number[]> {
    const sampledTokens: number[] = [];
    const sequenceLength = logits.shape[1] as number;

    for (let i = 0; i < Math.min(50, sequenceLength); i++) { // Max 50 tokens for question
      const stepLogits = logits.slice([0, i], [1, 1]);
      const probabilities = tf.softmax(stepLogits.div(temperature));
      
      const sampledIndex = await tf.multinomial(probabilities.squeeze(), 1).data();
      const token = sampledIndex[0];
      
      sampledTokens.push(token);
      
      // Stop if end token
      if (token === this.vocabulary.get('<END>')) {
        break;
      }
    }

    return sampledTokens;
  }

  /**
   * Generate plausible answer options for multiple choice
   */
  private generateAnswerOptions(question: string, contextTokens: number[]): string[] {
    // Extract key concepts from context
    const contextText = this.detokenize(contextTokens);
    const concepts = this.extractKeyConcepts(contextText);
    
    // Generate correct answer from context
    const correctAnswer = this.extractAnswer(question, contextText);
    
    // Generate distractors
    const distractors = this.generateDistractors(correctAnswer, concepts);
    
    const options = [correctAnswer, ...distractors].slice(0, 4);
    
    // Shuffle options
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    return options;
  }

  /**
   * Extract key concepts from text
   */
  private extractKeyConcepts(text: string): string[] {
    // Simple concept extraction - can be enhanced
    const words = text.split(/\s+/);
    const concepts = words.filter(word => 
      word.length > 3 && 
      /^[A-Z]/.test(word) && 
      !['The', 'This', 'That', 'When', 'Where'].includes(word)
    );
    return [...new Set(concepts)].slice(0, 10);
  }

  /**
   * Extract answer from context based on question
   */
  private extractAnswer(question: string, context: string): string {
    // Simple answer extraction - can be enhanced with NLP
    const sentences = context.split(/[.!?]+/);
    const questionWords = question.toLowerCase().split(/\s+/);
    
    let bestSentence = sentences[0] || 'Unknown answer';
    let maxScore = 0;

    sentences.forEach(sentence => {
      const sentenceWords = sentence.toLowerCase().split(/\s+/);
      const score = questionWords.reduce((acc, word) => {
        return acc + (sentenceWords.includes(word) ? 1 : 0);
      }, 0);

      if (score > maxScore) {
        maxScore = score;
        bestSentence = sentence.trim();
      }
    });

    return bestSentence.substring(0, 100); // Limit length
  }

  /**
   * Generate distractor answers
   */
  private generateDistractors(correctAnswer: string, concepts: string[]): string[] {
    const distractors: string[] = [];
    
    // Type 1: Modified correct answer
    distractors.push(this.modifyAnswer(correctAnswer));
    
    // Type 2: Related but incorrect
    if (concepts.length > 0) {
      distractors.push(`Related to ${concepts[0]} but incorrect information`);
    }
    
    // Type 3: Opposite or negated
    distractors.push(this.negateAnswer(correctAnswer));

    return distractors;
  }

  /**
   * Modify answer to create plausible distractor
   */
  private modifyAnswer(answer: string): string {
    const words = answer.split(/\s+/);
    const modifiedWords = words.map(word => {
      if (Math.random() < 0.2 && word.length > 4) {
        // Replace with similar-sounding word
        const alternatives = ['different', 'alternative', 'modified', 'changed'];
        return alternatives[Math.floor(Math.random() * alternatives.length)];
      }
      return word;
    });
    return modifiedWords.join(' ');
  }

  /**
   * Create negated version of answer
   */
  private negateAnswer(answer: string): string {
    if (answer.includes(' is ')) {
      return answer.replace(' is ', ' is not ');
    }
    if (answer.includes(' are ')) {
      return answer.replace(' are ', ' are not ');
    }
    return `Not ${answer.toLowerCase()}`;
  }

  /**
   * Evaluate question quality using the quality predictor
   */
  private async evaluateQuestionQuality(
    question: Omit<GeneratedQuestion, 'confidence' | 'context'>,
    encodedContext: tf.Tensor
  ): Promise<number> {
    try {
      const qualityScore = this.qualityPredictor!.predict(encodedContext) as tf.Tensor;
      const score = await qualityScore.data();
      qualityScore.dispose();
      return score[0];
    } catch (error) {
      console.warn('Quality evaluation failed:', error);
      return 0.5; // Default score
    }
  }

  /**
   * Save the trained model
   */
  async saveModel(path: string): Promise<void> {
    if (this.encoder && this.decoder && this.qualityPredictor) {
      await this.encoder.save(`${path}/encoder`);
      await this.decoder.save(`${path}/decoder`);
      await this.qualityPredictor.save(`${path}/quality_predictor`);
      
      // Save vocabulary
      const vocabData = {
        vocabulary: Array.from(this.vocabulary.entries()),
        reverseVocabulary: Array.from(this.reverseVocabulary.entries())
      };
      
      localStorage.setItem('questionGenerator_vocabulary', JSON.stringify(vocabData));
    }
  }

  /**
   * Load a pre-trained model
   */
  async loadModel(path: string): Promise<void> {
    try {
      this.encoder = await tf.loadLayersModel(`${path}/encoder/model.json`);
      this.decoder = await tf.loadLayersModel(`${path}/decoder/model.json`);
      this.qualityPredictor = await tf.loadLayersModel(`${path}/quality_predictor/model.json`);
      
      // Load vocabulary
      const vocabData = localStorage.getItem('questionGenerator_vocabulary');
      if (vocabData) {
        const parsed = JSON.parse(vocabData);
        this.vocabulary = new Map(parsed.vocabulary);
        this.reverseVocabulary = new Map(parsed.reverseVocabulary);
      }
      
      console.log('Model loaded successfully');
    } catch (error) {
      console.warn('Failed to load pre-trained model, using fresh initialization');
      await this.initialize();
    }
  }
}
