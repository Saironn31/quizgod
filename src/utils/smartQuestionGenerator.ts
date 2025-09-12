/**
 * Smart AI Question Generator
 * Creates intelligent multiple choice questions based on PDF content
 */

export interface Question {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
  type: 'factual' | 'conceptual' | 'analytical';
}

export interface QuestionOptions {
  numQuestions: number;
  questionTypes: ('factual' | 'conceptual' | 'analytical')[];
}

interface ContentAnalysis {
  sentences: string[];
  words: string[];
  concepts: string[];
  numbers: string[];
  definitions: string[];
  processes: string[];
  comparisons: string[];
  facts: string[];
  cleanedText: string;
  wordCount: number;
}

export class SmartQuestionGenerator {
  
  /**
   * Analyzes text and extracts key information for question generation
   */
  private analyzeContent(text: string): ContentAnalysis {
    // Clean the text first - remove page numbers, headers, footers
    const cleanedText = text
      .replace(/Page \d+/gi, '') // Remove "Page X"
      .replace(/\b\d+\s*of\s*\d+\b/gi, '') // Remove "X of Y"
      .replace(/^[\s\d\-_\.]+$/gm, '') // Remove lines with only numbers/symbols
      .replace(/\b(header|footer|copyright|©|\(c\))\b.*$/gmi, '') // Remove header/footer content
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    const sentences = cleanedText.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const words = cleanedText.toLowerCase().split(/\s+/);
    
    // Extract meaningful concepts (proper nouns, technical terms, multi-word concepts)
    const concepts = cleanedText.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    // Filter out common words and single letters
    const meaningfulConcepts = concepts
      .filter(c => c.length > 2 && !['The', 'This', 'That', 'When', 'Where', 'What', 'How', 'Why', 'Page', 'Chapter', 'Section'].includes(c))
      .slice(0, 15);
    
    // Extract numbers and measurements with context
    const numbers = cleanedText.match(/\b\d+(?:\.\d+)?(?:\s*(?:percent|%|kg|cm|meters?|years?|hours?|minutes?|seconds?|degrees?|miles?|feet?|inches?|pounds?|dollars?|\$))\b/gi) || [];
    
    // Extract definitions (more flexible patterns)
    const definitions = sentences.filter(s => 
      /\b(?:is|are|means|refers to|defined as|known as|called|termed|describes?|represents?)\b/i.test(s) &&
      s.length > 30 && s.length < 200
    );
    
    // Extract processes and sequences
    const processes = sentences.filter(s => 
      /\b(?:first|second|then|next|finally|process|step|method|procedure|begins?|starts?|follows?|leads to)\b/i.test(s) &&
      s.length > 25
    );
    
    // Extract comparisons and relationships
    const comparisons = sentences.filter(s => 
      /\b(?:compared to|versus|rather than|instead of|different from|similar to|unlike|like|whereas|while|however)\b/i.test(s) &&
      s.length > 30
    );

    // Extract factual statements (sentences with specific information)
    const facts = sentences.filter(s => 
      s.length > 20 && s.length < 150 &&
      !s.toLowerCase().includes('page') &&
      (numbers.some(num => s.includes(num)) || meaningfulConcepts.some(concept => s.includes(concept)))
    );

    console.log('Analysis results:', {
      sentences: sentences.length,
      concepts: meaningfulConcepts,
      definitions: definitions.length,
      processes: processes.length,
      facts: facts.length,
      cleanedTextLength: cleanedText.length
    });

    return {
      sentences,
      words,
      concepts: meaningfulConcepts,
      numbers,
      definitions,
      processes,
      comparisons,
      facts,
      cleanedText,
      wordCount: words.length
    };
  }

  /**
   * Generates factual questions (basic recall)
   */
  private generateFactualQuestions(analysis: ContentAnalysis, count: number): Question[] {
    const questions: Question[] = [];
    
    // Prioritize fact-based questions from actual content
    for (let i = 0; i < Math.min(count, analysis.facts.length); i++) {
      const fact = analysis.facts[i];
      
      // Extract key information from the fact
      const concepts = analysis.concepts.filter(c => fact.includes(c));
      const numbers = analysis.numbers.filter(n => fact.includes(n));
      
      if (concepts.length > 0) {
        const mainConcept = concepts[0];
        const cleanedFact = fact.replace(/^\s*[\d\-\.\s]*/, '').trim(); // Remove leading numbers/symbols
        
        questions.push({
          question: `Based on the content, what is true about ${mainConcept}?`,
          options: [
            cleanedFact,
            this.generateDistractor(cleanedFact, "alternative fact"),
            this.generateDistractor(cleanedFact, "opposite fact"),
            this.generateDistractor(cleanedFact, "unrelated fact")
          ],
          correct: 0,
          type: 'factual',
          explanation: `According to the content: ${cleanedFact}`
        });
      } else if (numbers.length > 0) {
        const number = numbers[0];
        questions.push({
          question: `What is the significance of ${number} mentioned in the content?`,
          options: [
            fact.trim(),
            this.generateDistractor(fact, "different number"),
            this.generateDistractor(fact, "wrong context"),
            this.generateDistractor(fact, "unrelated measurement")
          ],
          correct: 0,
          type: 'factual'
        });
      }
    }

    // Definition-based questions from actual definitions found
    const definitionQuestions = Math.min(count - questions.length, analysis.definitions.length);
    for (let i = 0; i < definitionQuestions; i++) {
      const def = analysis.definitions[i];
      const match = def.match(/^[^,]*\s+(?:is|are|means|refers to|defined as|known as)\s+(.+)/i);
      
      if (match && match[1]) {
        const beforeVerb = def.split(/\s+(?:is|are|means|refers to|defined as|known as)\s+/i)[0].trim();
        const afterVerb = match[1].trim();
        
        if (beforeVerb.length > 2 && afterVerb.length > 10) {
          questions.push({
            question: `According to the content, what is ${beforeVerb}?`,
            options: [
              afterVerb,
              this.generateDistractor(afterVerb, "alternative definition"),
              this.generateDistractor(afterVerb, "opposite meaning"),
              this.generateDistractor(afterVerb, "unrelated concept")
            ],
            correct: 0,
            type: 'factual',
            explanation: `${beforeVerb} is defined as ${afterVerb}`
          });
        }
      }
    }

    return questions.slice(0, count);
  }

  /**
   * Generates conceptual questions (understanding & principles)
   */
  private generateConceptualQuestions(analysis: ContentAnalysis, count: number): Question[] {
    const questions: Question[] = [];

    // Process-based questions from actual content
    for (let i = 0; i < Math.min(count, analysis.processes.length); i++) {
      const process = analysis.processes[i];
      const concepts = analysis.concepts.filter(c => process.includes(c));
      
      if (concepts.length > 0) {
        const mainConcept = concepts[0];
        questions.push({
          question: `How does the content describe ${mainConcept}?`,
          options: [
            process.trim(),
            this.generateDistractor(process, "alternative process"),
            this.generateDistractor(process, "opposite process"),
            this.generateDistractor(process, "unrelated process")
          ],
          correct: 0,
          type: 'conceptual',
          explanation: `The content describes: ${process.trim()}`
        });
      }
    }

    // Comparison-based questions from actual content
    const remainingCount = count - questions.length;
    for (let i = 0; i < Math.min(remainingCount, analysis.comparisons.length); i++) {
      const comparison = analysis.comparisons[i];
      const concepts = analysis.concepts.filter(c => comparison.includes(c));
      
      if (concepts.length > 0) {
        const mainConcept = concepts[0];
        questions.push({
          question: `According to the content, how does ${mainConcept} relate to other concepts?`,
          options: [
            comparison.trim(),
            this.generateDistractor(comparison, "different relationship"),
            this.generateDistractor(comparison, "opposite relationship"),
            this.generateDistractor(comparison, "unrelated comparison")
          ],
          correct: 0,
          type: 'conceptual'
        });
      }
    }

    return questions.slice(0, count);
  }

  /**
   * Generates analytical questions (critical thinking)
   */
  private generateAnalyticalQuestions(analysis: ContentAnalysis, count: number): Question[] {
    const questions: Question[] = [];

    // Application questions
    const applicationSentences = analysis.sentences.filter(s => 
      /\b(?:apply|application|used for|example|instance|case)\b/i.test(s)
    );

    for (let i = 0; i < Math.min(count, applicationSentences.length); i++) {
      const sentence = applicationSentences[i];
      const concept = this.extractMainConcept(sentence);
      
      questions.push({
        question: `In which scenario would you most likely apply ${concept}?`,
        options: [
          this.generateRealisticScenario(concept, sentence),
          this.generateDistractor(concept, "wrong field"),
          this.generateDistractor(concept, "opposite situation"),
          this.generateDistractor(concept, "unrelated context")
        ],
        correct: 0,
        type: 'analytical'
      });
    }

    // Problem-solving questions
    const problemSentences = analysis.sentences.filter(s => 
      /\b(?:problem|solution|solve|issue|challenge|difficulty)\b/i.test(s)
    );

    const remainingCount = count - questions.length;
    for (let i = 0; i < Math.min(remainingCount, problemSentences.length); i++) {
      const sentence = problemSentences[i];
      const problem = this.extractProblem(sentence);
      
      questions.push({
        question: `What would be the best approach to solve: ${problem}?`,
        options: [
          this.extractSolution(sentence),
          this.generateDistractor(problem, "overcomplicated solution"),
          this.generateDistractor(problem, "wrong approach"),
          this.generateDistractor(problem, "irrelevant method")
        ],
        correct: 0,
        type: 'analytical'
      });
    }

    return questions.slice(0, count);
  }

  /**
   * Helper methods for content extraction and generation
   */
  private extractKeyInfo(sentence: string, concept: string): string {
    const words = sentence.split(' ');
    const conceptIndex = words.findIndex(w => w.toLowerCase().includes(concept.toLowerCase()));
    const start = Math.max(0, conceptIndex - 3);
    const end = Math.min(words.length, conceptIndex + 8);
    return words.slice(start, end).join(' ').replace(/[.,;:!?]$/, '');
  }

  private extractSteps(process: string): string[] {
    const stepWords = ['first', 'second', 'then', 'next', 'finally'];
    const steps: string[] = [];
    
    stepWords.forEach(stepWord => {
      const regex = new RegExp(`\\b${stepWord}[^.!?]*`, 'gi');
      const matches = process.match(regex);
      if (matches) {
        steps.push(...matches.map(m => m.replace(stepWord, '').trim()));
      }
    });
    
    return steps.slice(0, 4);
  }

  private shuffleSteps(steps: string[]): string[] {
    const shuffled = [...steps];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private reverseSteps(steps: string[]): string[] {
    return [...steps].reverse();
  }

  private mixSteps(steps: string[]): string[] {
    if (steps.length < 3) return steps;
    const mixed = [...steps];
    [mixed[0], mixed[1]] = [mixed[1], mixed[0]];
    return mixed;
  }

  private extractComparisonElements(comparison: string): string[] {
    const comparisonWords = ['compared to', 'versus', 'rather than', 'instead of', 'different from', 'similar to', 'unlike', 'like'];
    
    for (const word of comparisonWords) {
      if (comparison.toLowerCase().includes(word)) {
        const parts = comparison.toLowerCase().split(word);
        if (parts.length >= 2) {
          return [
            parts[0].trim().split(' ').slice(-3).join(' '),
            parts[1].trim().split(' ').slice(0, 3).join(' ')
          ];
        }
      }
    }
    return [];
  }

  private extractDifference(comparison: string): string {
    const match = comparison.match(/different.{0,50}(?:in|by|through|because)/i);
    return match ? match[0] : comparison.substring(0, 80) + '...';
  }

  private extractCausality(sentence: string): { cause: string; effect: string } {
    const causeWords = ['because', 'due to', 'caused by'];
    const effectWords = ['results in', 'leads to', 'causes'];
    
    for (const word of causeWords) {
      if (sentence.toLowerCase().includes(word)) {
        const parts = sentence.toLowerCase().split(word);
        return {
          effect: parts[0].trim(),
          cause: parts[1].trim()
        };
      }
    }
    
    for (const word of effectWords) {
      if (sentence.toLowerCase().includes(word)) {
        const parts = sentence.toLowerCase().split(word);
        return {
          cause: parts[0].trim(),
          effect: parts[1].trim()
        };
      }
    }
    
    return { cause: '', effect: '' };
  }

  private extractMainConcept(sentence: string): string {
    const words = sentence.split(' ').filter(w => w.length > 3);
    return words.slice(0, 3).join(' ');
  }

  private generateRealisticScenario(concept: string, context: string): string {
    const scenarios = [
      `When implementing ${concept} in a real-world setting`,
      `During practical application of ${concept}`,
      `In a scenario where ${concept} is most relevant`,
      `When ${concept} principles are applied correctly`
    ];
    return scenarios[Math.floor(Math.random() * scenarios.length)];
  }

  private extractProblem(sentence: string): string {
    const problemMatch = sentence.match(/problem.{0,30}/i) || sentence.match(/issue.{0,30}/i);
    return problemMatch ? problemMatch[0] : sentence.substring(0, 40) + '...';
  }

  private extractSolution(sentence: string): string {
    const solutionMatch = sentence.match(/solution.{0,40}/i) || sentence.match(/solve.{0,40}/i);
    return solutionMatch ? solutionMatch[0] : sentence.substring(0, 50) + '...';
  }

  private generateDistractor(correct: string, type: string): string {
    const distractors = {
      "alternative definition": [
        "A related but incorrect interpretation",
        "A commonly confused alternative",
        "A similar concept with different meaning",
        "An outdated or incorrect version"
      ],
      "opposite meaning": [
        "The opposite or contrary concept",
        "An inverse relationship",
        "A contradictory principle",
        "The reverse process"
      ],
      "unrelated concept": [
        "An unrelated topic from different field",
        "A completely different subject matter",
        "An irrelevant concept",
        "A distractor from another domain"
      ],
      "similar term": [
        "A similar-sounding but different term",
        "A related but distinct concept",
        "A commonly confused alternative",
        "A term from the same category but different meaning"
      ],
      "wrong field": [
        "An application in an inappropriate context",
        "A misuse in the wrong domain",
        "An incorrect field of application",
        "A scenario where it doesn't apply"
      ],
      "opposite situation": [
        "A scenario with opposite conditions",
        "A contradictory situation",
        "An inappropriate use case",
        "A situation requiring different approach"
      ]
    };

    const options = distractors[type as keyof typeof distractors] || distractors["unrelated concept"];
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Main method to generate questions
   */
  generateQuestions(text: string, options: QuestionOptions): Question[] {
    const analysis = this.analyzeContent(text);
    const allQuestions: Question[] = [];
    
    console.log('Question generation input:', {
      textLength: text.length,
      analysisResults: analysis,
      requestedTypes: options.questionTypes,
      requestedCount: options.numQuestions
    });
    
    const totalTypes = options.questionTypes.length;
    const questionsPerType = Math.ceil(options.numQuestions / totalTypes);
    
    if (options.questionTypes.includes('factual')) {
      const factualQuestions = this.generateFactualQuestions(analysis, questionsPerType);
      allQuestions.push(...factualQuestions);
    }
    
    if (options.questionTypes.includes('conceptual')) {
      const conceptualQuestions = this.generateConceptualQuestions(analysis, questionsPerType);
      allQuestions.push(...conceptualQuestions);
    }
    
    if (options.questionTypes.includes('analytical')) {
      const analyticalQuestions = this.generateAnalyticalQuestions(analysis, questionsPerType);
      allQuestions.push(...analyticalQuestions);
    }
    
    // If we don't have enough questions, generate fallback questions from the cleanest content
    if (allQuestions.length < options.numQuestions) {
      const fallbackQuestions = this.generateFallbackQuestions(analysis, options.numQuestions - allQuestions.length);
      allQuestions.push(...fallbackQuestions);
    }
    
    console.log('Generated questions:', allQuestions);
    
    // Shuffle and limit to requested number
    const shuffled = this.shuffleArray(allQuestions);
    return shuffled.slice(0, options.numQuestions);
  }

  /**
   * Generate fallback questions when structured content is limited
   */
  private generateFallbackQuestions(analysis: any, count: number): Question[] {
    const questions: Question[] = [];
    
    // Use the best sentences we have
    const goodSentences = analysis.sentences.filter((s: string) => 
      s.length > 30 && s.length < 200 &&
      !s.toLowerCase().includes('page') &&
      analysis.concepts.some((concept: string) => s.includes(concept))
    );
    
    for (let i = 0; i < Math.min(count, goodSentences.length); i++) {
      const sentence = goodSentences[i];
      const relatedConcepts = analysis.concepts.filter((c: string) => sentence.includes(c));
      
      if (relatedConcepts.length > 0) {
        const concept = relatedConcepts[0];
        
        questions.push({
          question: `Based on the content, which statement about ${concept} is most accurate?`,
          options: [
            sentence.trim(),
            this.generateContextualDistractor(sentence, concept, "modified"),
            this.generateContextualDistractor(sentence, concept, "negated"),
            this.generateContextualDistractor(sentence, concept, "different")
          ],
          correct: 0,
          type: 'factual',
          explanation: `From the content: ${sentence.trim()}`
        });
      }
    }
    
    return questions;
  }

  /**
   * Generate more contextual distractors based on the actual content
   */
  private generateContextualDistractor(sentence: string, concept: string, type: string): string {
    const words = sentence.split(' ');
    
    switch (type) {
      case 'modified':
        // Change a key word or number
        return words.map(w => {
          if (w.match(/\d+/)) return (parseInt(w) + Math.floor(Math.random() * 10) + 1).toString();
          if (w.length > 6 && Math.random() > 0.7) return this.getSimilarWord(w);
          return w;
        }).join(' ');
        
      case 'negated':
        // Add negation or opposite meaning
        const negations = ['not', 'never', 'rarely', 'seldom', 'hardly'];
        const randomNegation = negations[Math.floor(Math.random() * negations.length)];
        return sentence.replace(/\b(is|are|can|will|does|has)\b/, `$1 ${randomNegation}`);
        
      case 'different':
        // Replace the main concept with a different one
        const otherConcepts = ['process', 'system', 'method', 'approach', 'technique', 'strategy'];
        const replacement = otherConcepts[Math.floor(Math.random() * otherConcepts.length)];
        return sentence.replace(new RegExp(concept, 'gi'), replacement);
        
      default:
        return this.generateDistractor(sentence, "alternative fact");
    }
  }

  /**
   * Get a similar word for distractor generation
   */
  private getSimilarWord(word: string): string {
    const synonyms: { [key: string]: string[] } = {
      'important': ['significant', 'crucial', 'vital', 'essential'],
      'large': ['big', 'huge', 'massive', 'enormous'],
      'small': ['tiny', 'little', 'minimal', 'minor'],
      'fast': ['quick', 'rapid', 'swift', 'speedy'],
      'slow': ['gradual', 'delayed', 'sluggish', 'leisurely'],
      'good': ['excellent', 'superior', 'effective', 'beneficial'],
      'bad': ['poor', 'inferior', 'inadequate', 'harmful']
    };
    
    const lowerWord = word.toLowerCase();
    if (synonyms[lowerWord]) {
      const options = synonyms[lowerWord];
      return options[Math.floor(Math.random() * options.length)];
    }
    
    return word;
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

// Export convenience function
export function generateSmartQuestions(text: string, options: QuestionOptions): Question[] {
  console.log('=== SMART QUESTION GENERATOR START ===');
  console.log('Input text length:', text.length);
  console.log('Input text preview:', text.substring(0, 200));
  console.log('Options:', options);
  
  const generator = new SmartQuestionGenerator();
  const result = generator.generateQuestions(text, options);
  
  console.log('Generated questions count:', result.length);
  console.log('Generated questions:', result);
  console.log('=== SMART QUESTION GENERATOR END ===');
  
  return result;
}
