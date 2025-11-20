import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Paddle webhook events we care about
type PaddleEvent = {
  event_type: string;
  data: {
    id: string;
    status: string;
    customer_id: string;
    custom_data?: {
      userId: string;
      userEmail: string;
    };
    items?: Array<{
      price_id: string;
      quantity: number;
    }>;
  };
};

export async function POST(req: NextRequest) {
  try {
    const body: PaddleEvent = await req.json();
    
    console.log('Paddle webhook received:', body.event_type);

    const { event_type, data } = body;
    const userId = data.custom_data?.userId;

    if (!userId) {
      console.error('No userId found in webhook data');
      return NextResponse.json({ error: 'No userId provided' }, { status: 400 });
    }

    // Handle different event types
    switch (event_type) {
      case 'subscription.created':
      case 'subscription.activated':
      case 'subscription.updated':
        // User subscribed or subscription updated
        if (data.status === 'active') {
          await updateUserPremiumStatus(userId, true);
          console.log(`User ${userId} upgraded to premium`);
        }
        break;

      case 'subscription.canceled':
      case 'subscription.paused':
        // User canceled or paused subscription
        await updateUserPremiumStatus(userId, false);
        console.log(`User ${userId} premium status removed`);
        break;

      case 'subscription.past_due':
        // Payment failed - could send notification
        console.log(`User ${userId} subscription past due`);
        break;

      default:
        console.log(`Unhandled event type: ${event_type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function updateUserPremiumStatus(userId: string, isPremium: boolean) {
  try {
    // Initialize Firebase Admin if not already initialized
    if (!admin.apps.length) {
      const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
          privateKey: privateKey!,
        }),
      });
    }

    const db = admin.firestore();
    await db.collection('users').doc(userId).update({
      isPremium,
      premiumUpdatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to update user premium status:', error);
    throw error;
  }
}
