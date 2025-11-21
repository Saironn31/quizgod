import { NextRequest, NextResponse } from 'next/server';
import { isUserPremium } from '@/lib/firestore';

/**
 * Protected AI Quiz Generation API
 * Validates premium status server-side before allowing AI generation
 */

// Rate limiting storage (in-memory for simplicity, use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const FREE_TIER_LIMIT = 3; // 3 requests per minute for free users
const PREMIUM_TIER_LIMIT = 30; // 30 requests per minute for premium users

function checkRateLimit(userId: string, isPremium: boolean): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const limit = isPremium ? PREMIUM_TIER_LIMIT : FREE_TIER_LIMIT;
  
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new limit
    rateLimitMap.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return { allowed: true, remaining: limit - 1 };
  }
  
  if (userLimit.count >= limit) {
    return { allowed: false, remaining: 0 };
  }
  
  userLimit.count++;
  return { allowed: true, remaining: limit - userLimit.count };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, pdfText, questionTypes, difficulty, subject } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }

    if (!pdfText || !questionTypes || !difficulty || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check premium status
    const isPremium = await isUserPremium(userId);

    // Rate limiting
    const rateLimit = checkRateLimit(userId, isPremium);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please wait before generating more quizzes.',
          retryAfter: 60 // seconds
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Date.now() + RATE_LIMIT_WINDOW)
          }
        }
      );
    }

    // Premium feature gate: Advanced question types
    const premiumQuestionTypes = ['fill-blank'];
    const requestedTypes = Object.keys(questionTypes).filter(type => questionTypes[type] > 0);
    const usesPremiumFeatures = requestedTypes.some(type => premiumQuestionTypes.includes(type));
    
    if (usesPremiumFeatures && !isPremium) {
      return NextResponse.json(
        { 
          error: 'Premium subscription required for advanced question types',
          premiumRequired: true
        },
        { status: 403 }
      );
    }

    // Calculate total questions
    const totalQuestions = Object.values(questionTypes).reduce((sum: number, count) => sum + (count as number), 0);

    // Free tier limits
    if (!isPremium && totalQuestions > 10) {
      return NextResponse.json(
        { 
          error: 'Free tier limited to 10 questions per quiz. Upgrade to Premium for unlimited questions.',
          limit: 10,
          premiumRequired: true
        },
        { status: 403 }
      );
    }

    // Call Groq API
    const groqKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    
    if (!groqKey) {
      return NextResponse.json(
        { error: 'AI service configuration error' },
        { status: 500 }
      );
    }

    // Build question type instructions
    const types = [];
    if (questionTypes['multiple-choice'] > 0) {
      types.push(`${questionTypes['multiple-choice']} multiple-choice questions (4 options each, mark correct with *)`);
    }
    if (questionTypes['true-false'] > 0) {
      types.push(`${questionTypes['true-false']} true/false questions (options: True/False, mark correct with *)`);
    }
    if (questionTypes['fill-blank'] > 0) {
      types.push(`${questionTypes['fill-blank']} fill-in-the-blank questions (ANSWER MUST BE 1-3 WORDS MAXIMUM)`);
    }

    const basePrompt = `You are a quiz generator. Create a quiz about ${subject} with difficulty level: ${difficulty.toUpperCase()}.

Based on the following content, generate EXACTLY:
${types.join('\n')}

Content:
${pdfText.slice(0, 15000)}

MANDATORY FORMAT - Follow this EXACTLY:

For MULTIPLE CHOICE questions:
1. What is the question text?
A) First option
B) Second option*
C) Third option
D) Fourth option

For TRUE/FALSE questions:
2. Is this statement correct?
A) True*
B) False

For FILL-IN-THE-BLANK questions:
3. The capital of France is _____.
ANSWER: Paris

CRITICAL RULES:
1. Start output with "1." immediately - NO introduction text
2. For multiple-choice and true/false: EXACTLY ONE asterisk (*) marking the correct answer
3. For fill-blank: Use "ANSWER:" followed by ONLY 1-3 WORDS (no full sentences or long phrases)
4. Number questions sequentially: 1, 2, 3, etc.
5. Generate EXACTLY the number specified for each type
6. Adjust difficulty based on: ${difficulty === 'easy' ? 'Simple concepts, clear answers' : difficulty === 'medium' ? 'Moderate complexity, some reasoning' : 'Complex concepts, critical thinking required'}
7. End after the last question - NO conclusion text
8. Fill-in-the-blank answers will be checked case-insensitively, so focus on the core term/concept

Generate the questions NOW:`;

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [
            { 
              role: 'system', 
              content: 'You are a quiz generator. Always mark the correct answer with an asterisk (*) immediately after the option text. Format: "Correct answer*". This is mandatory.'
            },
            { role: 'user', content: basePrompt }
          ],
          temperature: 0.7,
          max_tokens: 4000,
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Groq API error:', errorData);
      return NextResponse.json(
        { error: 'AI generation failed. Please try again.' },
        { status: 500 }
      );
    }

    const data = await response.json();
    let generatedText = data.choices?.[0]?.message?.content;

    if (!generatedText) {
      return NextResponse.json(
        { error: 'No content generated. Please try again.' },
        { status: 500 }
      );
    }

    // Clean up generated text
    const firstQuestionMatch = generatedText.match(/1\.\s/);
    if (firstQuestionMatch) {
      generatedText = generatedText.substring(firstQuestionMatch.index!);
    }

    const lines = generatedText.split('\n');
    let lastQuestionLineIndex = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim().match(/^[A-D][\)\.\:]\s*.+/i)) {
        lastQuestionLineIndex = i;
        break;
      }
    }
    if (lastQuestionLineIndex !== -1) {
      generatedText = lines.slice(0, lastQuestionLineIndex + 1).join('\n');
    }

    return NextResponse.json(
      { 
        generatedText,
        success: true,
        rateLimit: {
          remaining: rateLimit.remaining,
          limit: isPremium ? PREMIUM_TIER_LIMIT : FREE_TIER_LIMIT
        }
      },
      {
        headers: {
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Limit': String(isPremium ? PREMIUM_TIER_LIMIT : FREE_TIER_LIMIT)
        }
      }
    );

  } catch (error) {
    console.error('AI generation error:', error);
    return NextResponse.json(
      { error: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}
