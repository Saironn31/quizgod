# Payment Setup Guide - Stripe Integration

This guide covers the complete Stripe payment integration for QuizGod premium subscriptions.

## Overview

The payment system uses Stripe Checkout for secure payment processing and webhooks to automatically grant premium access.

## Prerequisites

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard

## Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe Keys (get from https://dashboard.stripe.com/apikeys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx

# Stripe Webhook Secret (get after setting up webhook endpoint)
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Premium Product Configuration
STRIPE_PREMIUM_PRICE_ID=price_xxxxxxxxxxxxx
```

## Stripe Setup Steps

### 1. Create a Product in Stripe Dashboard

1. Go to https://dashboard.stripe.com/products
2. Click "Add product"
3. Fill in:
   - **Name**: QuizGod Premium
   - **Description**: Access to Classes, AI Quiz Generator, and ad-free experience
   - **Pricing**: Set your price (e.g., $9.99/month or one-time payment)
   - **Type**: Choose "Recurring" for subscription or "One time" for lifetime access
4. Click "Save product"
5. Copy the **Price ID** (starts with `price_`) and add it to your `.env.local` as `STRIPE_PREMIUM_PRICE_ID`

### 2. Configure Webhook Endpoint

#### For Production (Vercel/Deployed Site):

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Set the endpoint URL to: `https://yourdomain.com/api/webhook/stripe`
4. Select events to listen to:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click "Add endpoint"
6. Copy the **Signing secret** (starts with `whsec_`) and add it to your `.env.local`

#### For Local Development:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Run: `stripe login`
3. Forward webhooks to localhost:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook/stripe
   ```
4. Copy the webhook signing secret shown in terminal to `.env.local`

### 3. Test the Integration

#### Test Mode (Recommended First):

1. Use test API keys from Stripe Dashboard (start with `pk_test_` and `sk_test_`)
2. Use test card numbers:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - Any future expiry date, any CVC, any postal code

3. Test the flow:
   - Click "Upgrade to Premium" on Classes or AI Generator
   - Complete checkout with test card
   - Verify webhook receives event
   - Check that user gets premium access in Firebase

#### Production Mode:

1. Switch to live API keys (start with `pk_live_` and `sk_live_`)
2. Set up production webhook endpoint on your deployed domain
3. Use real payment cards

## File Structure

```
src/
├── app/
│   └── api/
│       ├── checkout/
│       │   └── route.ts          # Creates Stripe checkout session
│       └── webhook/
│           └── stripe/
│               └── route.ts      # Handles Stripe webhooks
├── components/
│   └── PremiumUpgradeModal.tsx  # Payment UI component
└── lib/
    └── stripe.ts                # Stripe initialization
```

## How It Works

### 1. User Clicks "Upgrade to Premium"

- Opens `PremiumUpgradeModal` component
- Shows pricing and features

### 2. User Clicks "Subscribe"

- Frontend calls `/api/checkout` with user info
- API creates Stripe Checkout session
- User redirected to Stripe's secure checkout page

### 3. User Completes Payment

- Stripe processes payment
- Redirects back to success page
- Stripe sends webhook event to `/api/webhook/stripe`

### 4. Webhook Grants Premium Access

- Webhook handler verifies signature
- Extracts user email from checkout session
- Updates Firebase user document: `{ isPremium: true }`
- User immediately gets premium features

## Security Notes

- ✅ Webhook signature verification prevents fake requests
- ✅ All payment processing happens on Stripe's secure servers
- ✅ API keys stored in environment variables, never in code
- ✅ Secret key only used server-side (API routes)
- ✅ Frontend only uses publishable key (safe to expose)

## Pricing Recommendations

### Monthly Subscription
- $4.99/month - Entry level
- $9.99/month - Standard (recommended)
- $14.99/month - Premium

### One-Time Purchase
- $49.99 - Lifetime access (10x monthly discount)
- $99.99 - Lifetime + future features

### Free Trial
- Set up in Stripe with 7 or 14 day trial period
- Requires payment method upfront

## Country Detection

The system automatically detects user country from IP address (no location permission needed):

- Uses free IP geolocation API
- Shows currency in local format
- Adjusts pricing if configured in Stripe for multiple countries
- Falls back to USD if detection fails

## Troubleshooting

### Webhook Not Working

1. Check endpoint URL is correct and accessible
2. Verify webhook secret matches in `.env.local`
3. Check Stripe Dashboard > Webhooks > Logs for errors
4. Ensure API route is deployed and not blocked by firewall

### Payment Not Granting Premium

1. Check webhook is receiving events (Stripe Dashboard)
2. Verify email in checkout matches Firebase user email
3. Check Firebase user document updates
4. Look at Vercel/server logs for errors

### Test Cards Not Working

1. Make sure using test mode API keys
2. Use complete test card: 4242 4242 4242 4242
3. Use any future expiry, any 3-digit CVC
4. Check Stripe Dashboard test mode is active

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- Test Cards: https://stripe.com/docs/testing

## Production Checklist

Before going live:

- [ ] Switch to live Stripe API keys
- [ ] Set up production webhook endpoint
- [ ] Test with real card (small amount)
- [ ] Configure proper pricing
- [ ] Add refund policy page
- [ ] Set up email receipts in Stripe
- [ ] Enable 3D Secure for compliance
- [ ] Test on mobile devices
- [ ] Configure tax collection (if required)
- [ ] Set up billing portal for customers to manage subscriptions
