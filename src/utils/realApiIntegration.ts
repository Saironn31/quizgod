// Real API integration examples for production use
// This file shows how to implement actual API calls to each provider

// GROQ API Integration
export const callGroqAPI = async (text: string, questionCount: number, apiKey: string) => {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama2-70b-4096', // or 'mixtral-8x7b-32768'
      messages: [{
        role: 'user',
        content: `Create ${questionCount} multiple choice questions from this text. Return only JSON array: ${text}`
      }],
      temperature: 0.7,
      max_tokens: 2000
    })
  });
  
  if (!response.ok) {
    throw new Error(`Groq API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  return parseAIResponse(data.choices[0].message.content);
};

// TOGETHER AI Integration
export const callTogetherAPI = async (text: string, questionCount: number, apiKey: string) => {
  const response = await fetch('https://api.together.xyz/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'togethercomputer/llama-2-70b-chat',
      messages: [{
        role: 'user',
        content: `Generate ${questionCount} quiz questions from: ${text}`
      }],
      temperature: 0.7,
      max_tokens: 2000
    })
  });
  
  const data = await response.json();
  return parseAIResponse(data.choices[0].message.content);
};

// HUGGING FACE Integration
export const callHuggingFaceAPI = async (text: string, questionCount: number, apiKey: string) => {
  const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-large', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: `Create ${questionCount} multiple choice questions from this content: ${text}`,
      parameters: {
        max_length: 2000,
        temperature: 0.7
      }
    })
  });
  
  const data = await response.json();
  return parseAIResponse(data[0].generated_text);
};

// OPENROUTER Integration
export const callOpenRouterAPI = async (text: string, questionCount: number, apiKey: string) => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'QuizGod AI Quiz Generator',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-2-70b-chat', // Free model
      messages: [{
        role: 'user',
        content: `Create ${questionCount} quiz questions with 4 options each from: ${text}`
      }]
    })
  });
  
  const data = await response.json();
  return parseAIResponse(data.choices[0].message.content);
};

// COHERE Integration
export const callCohereAPI = async (text: string, questionCount: number, apiKey: string) => {
  const response = await fetch('https://api.cohere.ai/v1/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'command',
      prompt: `Generate ${questionCount} multiple choice questions from this text: ${text}`,
      max_tokens: 2000,
      temperature: 0.7
    })
  });
  
  const data = await response.json();
  return parseAIResponse(data.generations[0].text);
};

// Parse AI response to extract questions
const parseAIResponse = (response: string) => {
  try {
    // Try to parse as JSON first
    return JSON.parse(response);
  } catch {
    // If not JSON, try to extract questions from text
    return extractQuestionsFromText(response);
  }
};

// Extract questions from plain text response
const extractQuestionsFromText = (text: string) => {
  const questions = [];
  const lines = text.split('\n').filter(line => line.trim());
  
  let currentQuestion = null;
  let options = [];
  
  for (const line of lines) {
    if (line.includes('?')) {
      if (currentQuestion) {
        questions.push({
          question: currentQuestion,
          options: options,
          correctAnswer: 0 // Default to first option
        });
      }
      currentQuestion = line.trim();
      options = [];
    } else if (line.match(/^[A-D][\.\)]/)) {
      options.push(line.replace(/^[A-D][\.\)]/, '').trim());
    }
  }
  
  if (currentQuestion && options.length === 4) {
    questions.push({
      question: currentQuestion,
      options: options,
      correctAnswer: 0
    });
  }
  
  return questions;
};

// Usage example:
// const questions = await callGroqAPI(extractedText, 10, 'your-api-key');

export const API_ENDPOINTS = {
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  together: 'https://api.together.xyz/v1/chat/completions',
  huggingface: 'https://api-inference.huggingface.co/models/',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  cohere: 'https://api.cohere.ai/v1/generate'
};

export const FREE_MODELS = {
  groq: ['llama2-70b-4096', 'mixtral-8x7b-32768'],
  together: ['togethercomputer/llama-2-70b-chat'],
  huggingface: ['microsoft/DialoGPT-large', 'facebook/blenderbot-400M-distill'],
  openrouter: ['meta-llama/llama-2-70b-chat', 'anthropic/claude-instant-v1'],
  cohere: ['command', 'command-light']
};
