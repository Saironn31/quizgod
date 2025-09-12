/**
 * Intelligent Question Generator
 * Analyzes text content and generates multiple-choice questions
 */

export interface Question {
  question: string;
  options: string[];
  correct: number;
}

export interface QuestionGenerationOptions {
  numQuestions: number;
  difficulty: 'easy' | 'medium' | 'hard';
  questionTypes: ('factual' | 'conceptual' | 'analytical')[];
}

export class IntelligentQuestionGenerator {
  private keywords: string[] = [];
  private facts: string[] = [];
  private concepts: string[] = [];
  private definitions: string[] = [];

  constructor(private text: string) {
    this.analyzeText();
  }

  private analyzeText(): void {
    // Extract key information from text
    this.extractKeywords();
    this.extractFacts();
    this.extractConcepts();
    this.extractDefinitions();
  }

  private extractKeywords(): void {
    // Extract important keywords and terms
    const words = this.text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const wordFreq: { [key: string]: number } = {};
    
    words.forEach(word => {
      if (!this.isStopWord(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    // Get top keywords
    this.keywords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word]) => word);
  }

  private extractFacts(): void {
    // Extract sentences that contain factual information
    const sentences = this.text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    this.facts = sentences.filter(sentence => {
      const lower = sentence.toLowerCase();
      return (
        lower.includes('is') || 
        lower.includes('are') || 
        lower.includes('was') || 
        lower.includes('were') ||
        lower.includes('has') ||
        lower.includes('have') ||
        /\d+/.test(sentence) || // Contains numbers
        lower.includes('called') ||
        lower.includes('known as')
      );
    }).slice(0, 15);
  }

  private extractConcepts(): void {
    // Extract sentences that explain concepts
    const sentences = this.text.split(/[.!?]+/).filter(s => s.trim().length > 30);
    
    this.concepts = sentences.filter(sentence => {
      const lower = sentence.toLowerCase();
      return (
        lower.includes('because') ||
        lower.includes('therefore') ||
        lower.includes('as a result') ||
        lower.includes('due to') ||
        lower.includes('leads to') ||
        lower.includes('causes') ||
        lower.includes('results in') ||
        lower.includes('process') ||
        lower.includes('method') ||
        lower.includes('principle')
      );
    }).slice(0, 10);
  }

  private extractDefinitions(): void {
    // Extract definition-like sentences
    const sentences = this.text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    this.definitions = sentences.filter(sentence => {
      const lower = sentence.toLowerCase();
      return (
        lower.includes(' is ') ||
        lower.includes(' are ') ||
        lower.includes(' means ') ||
        lower.includes(' refers to ') ||
        lower.includes(' defined as ') ||
        lower.includes(' known as ') ||
        lower.includes(' called ')
      );
    }).slice(0, 10);
  }

  private isStopWord(word: string): boolean {
    const stopWords = [
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'about', 'into', 'through', 'during', 'before', 'after',
      'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under', 'again',
      'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
      'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
      'some', 'such', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
      'can', 'will', 'just', 'should', 'now', 'this', 'that', 'these', 'those'
    ];
    return stopWords.includes(word);
  }

  generateQuestions(options: QuestionGenerationOptions): Question[] {
    const questions: Question[] = [];
    const targetCount = Math.min(options.numQuestions, this.facts.length + this.concepts.length + this.definitions.length);

    // Generate different types of questions
    let questionsPerType = Math.ceil(targetCount / options.questionTypes.length);
    
    for (const type of options.questionTypes) {
      const typeQuestions = this.generateQuestionsByType(type, questionsPerType, options.difficulty);
      questions.push(...typeQuestions);
      
      if (questions.length >= targetCount) break;
    }

    return questions.slice(0, targetCount);
  }

  private generateQuestionsByType(type: string, count: number, difficulty: string): Question[] {
    const questions: Question[] = [];

    switch (type) {
      case 'factual':
        questions.push(...this.generateFactualQuestions(count));
        break;
      case 'conceptual':
        questions.push(...this.generateConceptualQuestions(count));
        break;
      case 'analytical':
        questions.push(...this.generateAnalyticalQuestions(count));
        break;
    }

    return questions;
  }

  private generateFactualQuestions(count: number): Question[] {
    const questions: Question[] = [];
    const usedFacts = new Set<string>();

    for (let i = 0; i < count && questions.length < this.facts.length; i++) {
      const fact = this.facts[i];
      if (usedFacts.has(fact)) continue;
      
      usedFacts.add(fact);
      const question = this.createFactualQuestion(fact);
      if (question) {
        questions.push(question);
      }
    }

    return questions;
  }

  private generateConceptualQuestions(count: number): Question[] {
    const questions: Question[] = [];
    const usedConcepts = new Set<string>();

    for (let i = 0; i < count && questions.length < this.concepts.length; i++) {
      const concept = this.concepts[i];
      if (usedConcepts.has(concept)) continue;
      
      usedConcepts.add(concept);
      const question = this.createConceptualQuestion(concept);
      if (question) {
        questions.push(question);
      }
    }

    return questions;
  }

  private generateAnalyticalQuestions(count: number): Question[] {
    const questions: Question[] = [];
    const usedTexts = new Set<string>();

    const combinedTexts = [...this.concepts, ...this.facts].slice(0, count * 2);

    for (let i = 0; i < count && i < combinedTexts.length; i++) {
      const text = combinedTexts[i];
      if (usedTexts.has(text)) continue;
      
      usedTexts.add(text);
      const question = this.createAnalyticalQuestion(text);
      if (question) {
        questions.push(question);
      }
    }

    return questions;
  }

  private createFactualQuestion(fact: string): Question | null {
    try {
      // Extract key information from the fact
      const cleanFact = fact.trim();
      
      // Look for patterns like "X is Y", "X are Y", etc.
      const patterns = [
        /(.+?)\s+is\s+(.+?)(?:\.|$)/i,
        /(.+?)\s+are\s+(.+?)(?:\.|$)/i,
        /(.+?)\s+was\s+(.+?)(?:\.|$)/i,
        /(.+?)\s+were\s+(.+?)(?:\.|$)/i,
        /(.+?)\s+has\s+(.+?)(?:\.|$)/i,
        /(.+?)\s+have\s+(.+?)(?:\.|$)/i,
      ];

      for (const pattern of patterns) {
        const match = cleanFact.match(pattern);
        if (match) {
          const subject = match[1].trim();
          const predicate = match[2].trim();
          
          if (subject.length > 3 && predicate.length > 3) {
            return {
              question: `What ${this.getQuestionWord(cleanFact)} ${subject}?`,
              options: this.generateOptions(predicate, 'factual'),
              correct: 0
            };
          }
        }
      }

      // Fallback: create a fill-in-the-blank question
      const words = cleanFact.split(' ');
      if (words.length > 5) {
        const importantWordIndex = this.findImportantWordIndex(words);
        const importantWord = words[importantWordIndex];
        const questionText = words.map((word, index) => 
          index === importantWordIndex ? '_____' : word
        ).join(' ');

        return {
          question: `Fill in the blank: ${questionText}`,
          options: this.generateOptions(importantWord, 'factual'),
          correct: 0
        };
      }

      return null;
    } catch (error) {
      console.warn('Error creating factual question:', error);
      return null;
    }
  }

  private createConceptualQuestion(concept: string): Question | null {
    try {
      const cleanConcept = concept.trim();
      
      // Create "why" or "how" questions for concepts
      if (cleanConcept.toLowerCase().includes('because')) {
        const parts = cleanConcept.split(/because/i);
        if (parts.length === 2) {
          const effect = parts[0].trim();
          const cause = parts[1].trim();
          
          return {
            question: `Why ${effect.toLowerCase()}?`,
            options: this.generateOptions(cause, 'conceptual'),
            correct: 0
          };
        }
      }

      if (cleanConcept.toLowerCase().includes('process')) {
        return {
          question: `What is the main characteristic of the process described: "${cleanConcept.substring(0, 80)}..."?`,
          options: this.generateOptions(this.extractKeyPhrase(cleanConcept), 'conceptual'),
          correct: 0
        };
      }

      // Fallback to a general conceptual question
      return {
        question: `Which statement best describes the concept: "${cleanConcept.substring(0, 60)}..."?`,
        options: this.generateOptions(this.extractKeyPhrase(cleanConcept), 'conceptual'),
        correct: 0
      };
    } catch (error) {
      console.warn('Error creating conceptual question:', error);
      return null;
    }
  }

  private createAnalyticalQuestion(text: string): Question | null {
    try {
      const cleanText = text.trim();
      
      // Create analysis questions
      const analysisTemplates = [
        `Based on the information: "${cleanText.substring(0, 80)}...", what can be concluded?`,
        `What is the most likely outcome of: "${cleanText.substring(0, 80)}..."?`,
        `Which factor is most important in: "${cleanText.substring(0, 80)}..."?`,
        `What would happen if: "${cleanText.substring(0, 80)}..." was changed?`
      ];

      const questionText = analysisTemplates[Math.floor(Math.random() * analysisTemplates.length)];
      const keyPhrase = this.extractKeyPhrase(cleanText);

      return {
        question: questionText,
        options: this.generateOptions(keyPhrase, 'analytical'),
        correct: 0
      };
    } catch (error) {
      console.warn('Error creating analytical question:', error);
      return null;
    }
  }

  private getQuestionWord(sentence: string): string {
    const lower = sentence.toLowerCase();
    if (lower.includes('when') || lower.includes('time') || lower.includes('date')) return 'is';
    if (lower.includes('where') || lower.includes('place') || lower.includes('location')) return 'is';
    if (lower.includes('how many') || lower.includes('number')) return 'is';
    return 'is';
  }

  private findImportantWordIndex(words: string[]): number {
    // Find the most important word (longest, contains capital letters, etc.)
    let bestIndex = 0;
    let bestScore = 0;

    words.forEach((word, index) => {
      let score = word.length;
      if (/[A-Z]/.test(word)) score += 3;
      if (this.keywords.includes(word.toLowerCase())) score += 5;
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    return bestIndex;
  }

  private extractKeyPhrase(text: string): string {
    const words = text.split(' ').filter(word => word.length > 3);
    const keyWords = words.filter(word => 
      this.keywords.includes(word.toLowerCase()) || 
      /[A-Z]/.test(word)
    );
    
    return keyWords.slice(0, 3).join(' ') || words.slice(0, 3).join(' ');
  }

  private generateOptions(correctAnswer: string, questionType: string): string[] {
    const options = [correctAnswer.trim()];
    
    // Generate plausible distractors based on question type and content
    const distractors = this.generateDistractors(correctAnswer, questionType);
    
    // Add distractors and shuffle
    options.push(...distractors.slice(0, 3));
    
    // Ensure we have exactly 4 options
    while (options.length < 4) {
      options.push(this.generateGenericDistractor(questionType));
    }

    // Shuffle options and find new correct index
    const correctOption = options[0];
    const shuffled = this.shuffleArray([...options]);
    const correctIndex = shuffled.indexOf(correctOption);

    return shuffled;
  }

  private generateDistractors(correctAnswer: string, questionType: string): string[] {
    const distractors: string[] = [];
    
    // Use context from the text to create plausible wrong answers
    const relatedWords = this.keywords.slice(0, 10);
    const relatedFacts = this.facts.slice(0, 5);

    switch (questionType) {
      case 'factual':
        // Generate factual distractors
        distractors.push(...relatedWords.slice(0, 3));
        break;
        
      case 'conceptual':
        // Generate conceptual distractors
        distractors.push(
          `Alternative explanation from ${this.extractKeyPhrase(correctAnswer)}`,
          `Different process involving ${relatedWords[0] || 'the subject'}`,
          `Opposite mechanism to ${this.extractKeyPhrase(correctAnswer)}`
        );
        break;
        
      case 'analytical':
        // Generate analytical distractors
        distractors.push(
          `Inverse relationship to the described pattern`,
          `Alternative interpretation of the evidence`,
          `Different conclusion based on similar data`
        );
        break;
    }

    return distractors.filter(d => d !== correctAnswer && d.length > 5);
  }

  private generateGenericDistractor(questionType: string): string {
    const generic = {
      factual: ['None of the above', 'Not specified in the text', 'Cannot be determined'],
      conceptual: ['No clear relationship exists', 'The process is undefined', 'Multiple factors interact'],
      analytical: ['Insufficient information provided', 'Multiple interpretations possible', 'Context dependent']
    };

    const options = generic[questionType as keyof typeof generic] || generic.factual;
    return options[Math.floor(Math.random() * options.length)];
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

// Main function to generate questions from text
export function generateQuestionsFromText(
  text: string, 
  options: QuestionGenerationOptions
): Question[] {
  const generator = new IntelligentQuestionGenerator(text);
  return generator.generateQuestions(options);
}

// Quick generation function with defaults
export function generateQuickQuestions(text: string, count: number = 5): Question[] {
  return generateQuestionsFromText(text, {
    numQuestions: count,
    difficulty: 'medium',
    questionTypes: ['factual', 'conceptual', 'analytical']
  });
}
