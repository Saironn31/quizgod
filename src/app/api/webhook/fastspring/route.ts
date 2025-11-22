import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// FastSpring Webhook Handler
// Documentation: https://fastspring.com/docs/webhooks/

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const events = body.events || [];

    console.log('FastSpring webhook received:', events.length, 'events');

    for (const event of events) {
      switch (event.type) {
        case 'order.completed':
          await handleOrderCompleted(event);
          break;
        
        case 'subscription.activated':
          await handleSubscriptionActivated(event);
          break;
        
        case 'subscription.canceled':
          await handleSubscriptionCanceled(event);
          break;
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
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

async function handleOrderCompleted(event: any) {
  try {
    const order = event.data;
    const customer = order.customer;
    const items = order.items || [];
    
    // Get userId from order tags or custom payload
    const userId = order.tags?.userId || order.payload?.userId;
    
    if (!userId) {
      console.error('No userId found in order:', order.id);
      return;
    }

    // Check if order contains premium product
    const hasPremiumProduct = items.some((item: any) => 
      item.product?.toLowerCase().includes('premium') ||
      item.display?.toLowerCase().includes('premium')
    );

    if (!hasPremiumProduct) {
      console.log('Order does not contain premium product');
      return;
    }

    // Grant premium access
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isPremium: true,
      premiumStatus: 'active',
      subscriptionDate: new Date(),
      premiumActivatedAt: new Date(),
      paymentProvider: 'fastspring',
      fastspringOrderId: order.id,
      fastspringCustomerId: customer.customer,
      updatedAt: new Date(),
    });

    console.log(`Premium granted to user: ${userId} (${customer.email})`);
  } catch (error) {
    console.error('Failed to grant premium access:', error);
    throw error;
  }
}

async function handleSubscriptionActivated(event: any) {
  try {
    const subscription = event.data;
    const userId = subscription.tags?.userId || subscription.payload?.userId;
    
    if (!userId) {
      console.error('No userId found in subscription');
      return;
    }

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isPremium: true,
      premiumStatus: 'active',
      subscriptionDate: new Date(),
      premiumActivatedAt: new Date(),
      subscriptionStatus: 'active',
      fastspringSubscriptionId: subscription.id,
      updatedAt: new Date(),
    });

    console.log(`Subscription activated for user: ${userId}`);
  } catch (error) {
    console.error('Failed to activate subscription:', error);
    throw error;
  }
}

async function handleSubscriptionCanceled(event: any) {
  try {
    const subscription = event.data;
    const userId = subscription.tags?.userId || subscription.payload?.userId;
    
    if (!userId) {
      console.error('No userId found in subscription');
      return;
    }

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isPremium: false,
      subscriptionStatus: 'cancelled',
      updatedAt: new Date(),
    });

    console.log(`Premium revoked for user: ${userId}`);
  } catch (error) {
    console.error('Failed to revoke premium access:', error);
    throw error;
  }
}
