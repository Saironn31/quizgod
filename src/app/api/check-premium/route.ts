import { NextRequest, NextResponse } from 'next/server';
import { isUserPremium } from '@/lib/firestore';

/**
 * Server-side premium validation middleware
 * Use this to protect premium features
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required', isPremium: false },
        { status: 400 }
      );
    }

    // Check premium status from Firestore
    const isPremium = await isUserPremium(userId);

    return NextResponse.json({ isPremium });
  } catch (error) {
    console.error('Error checking premium status:', error);
    return NextResponse.json(
      { error: 'Failed to verify premium status', isPremium: false },
      { status: 500 }
    );
  }
}
