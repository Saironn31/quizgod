import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
// @ts-ignore
import Stripe from 'stripe';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent succeeded:', paymentIntent.id);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancelled(subscription);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
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

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { metadata, customer_email } = session;

  if (!metadata?.userId || !customer_email) {
    console.error('Missing userId or email in checkout session');
    return;
  }

  try {
    // Grant premium access
    const userRef = doc(db, 'users', metadata.userId);
    await updateDoc(userRef, {
      isPremium: true,
      premiumActivatedAt: new Date(),
      stripeCustomerId: session.customer,
      updatedAt: new Date(),
    });

    console.log(`Premium granted to user: ${metadata.userId} (${customer_email})`);
  } catch (error) {
    console.error('Failed to grant premium access:', error);
    throw error;
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  try {
    // Find user by Stripe customer ID
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('stripeCustomerId', '==', customerId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error('No user found with stripeCustomerId:', customerId);
      return;
    }

    const userDoc = querySnapshot.docs[0];
    const isActive = subscription.status === 'active' || subscription.status === 'trialing';

    await updateDoc(userDoc.ref, {
      isPremium: isActive,
      subscriptionStatus: subscription.status,
      subscriptionId: subscription.id,
      updatedAt: new Date(),
    });

    console.log(`Subscription updated for user: ${userDoc.id}, active: ${isActive}`);
  } catch (error) {
    console.error('Failed to update subscription:', error);
    throw error;
  }
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  try {
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('stripeCustomerId', '==', customerId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error('No user found with stripeCustomerId:', customerId);
      return;
    }

    const userDoc = querySnapshot.docs[0];

    await updateDoc(userDoc.ref, {
      isPremium: false,
      subscriptionStatus: 'cancelled',
      updatedAt: new Date(),
    });

    console.log(`Premium revoked for user: ${userDoc.id}`);
  } catch (error) {
    console.error('Failed to revoke premium access:', error);
    throw error;
  }
}
