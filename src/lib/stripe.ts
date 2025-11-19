// @ts-ignore
import Stripe from 'stripe';

// Lazy initialization to avoid build-time errors when env vars aren't set
let stripeInstance: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      // @ts-ignore
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    });
  }
  return stripeInstance;
};

// For backward compatibility
export const stripe = new Proxy({} as Stripe, {
  get: (target, prop) => {
    const stripeInstance = getStripe();
    return stripeInstance[prop as keyof Stripe];
  }
});

export const PREMIUM_PRICE_ID = process.env.STRIPE_PREMIUM_PRICE_ID || '';
