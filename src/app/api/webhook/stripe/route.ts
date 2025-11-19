import { NextRequest, NextResponse } from 'next/server';
import { paymongo } from '@/lib/stripe';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body.data;

    // Handle PayMongo webhook events
    switch (event.attributes.type) {
      case 'payment.paid': {
        await handlePaymentPaid(event);
        break;
      }

      case 'payment.failed': {
        console.log('Payment failed:', event.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.attributes.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: `Webhook handler failed: ${error.message}` },
      { status: 500 }
    );
  }
}

async function handlePaymentPaid(event: any) {
  try {
    // Get checkout session to retrieve metadata
    const checkoutSessionId = event.attributes.data?.attributes?.checkout_session_id;
    
    if (!checkoutSessionId) {
      console.error('No checkout session ID in payment event');
      return;
    }

    const session = await paymongo.retrieveCheckoutSession(checkoutSessionId);
    const metadata = session.data.attributes.metadata;

    if (!metadata?.userId || !metadata?.email) {
      console.error('Missing userId or email in checkout session metadata');
      return;
    }

    // Grant premium access
    const userRef = doc(db, 'users', metadata.userId);
    await updateDoc(userRef, {
      isPremium: true,
      premiumActivatedAt: new Date(),
      paymentProvider: 'paymongo',
      paymentId: event.id,
      updatedAt: new Date(),
    });

    console.log(`Premium granted to user: ${metadata.userId} (${metadata.email})`);
  } catch (error) {
    console.error('Failed to grant premium access:', error);
    throw error;
  }
}
