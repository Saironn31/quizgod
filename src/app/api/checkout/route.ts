import { NextRequest, NextResponse } from 'next/server';
import { paymongo, PREMIUM_PRICE_PHP } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const { email, userId } = await req.json();

    if (!email || !userId) {
      return NextResponse.json(
        { error: 'Email and userId are required' },
        { status: 400 }
      );
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create PayMongo checkout session
    const session = await paymongo.createCheckoutSession({
      amount: PREMIUM_PRICE_PHP,
      description: 'QuizGod Premium - Lifetime Access',
      email,
      userId,
      successUrl: `${origin}/payment/success`,
      cancelUrl: `${origin}/payment/cancelled`,
    });

    return NextResponse.json({ 
      url: session.data.attributes.checkout_url,
      sessionId: session.data.id
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
