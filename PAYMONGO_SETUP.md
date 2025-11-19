# PayMongo Setup Guide for QuizGod (Philippines)

PayMongo is the leading payment gateway in the Philippines, supporting GCash, PayMaya, credit/debit cards, and GrabPay.

## Step 1: Create PayMongo Account (5 minutes)

1. Go to: **https://dashboard.paymongo.com/signup**
2. Fill in your details:
   - Email address
   - Business name: "QuizGod"
   - Business type: Educational Technology / Software
   - Phone number
3. Verify your email
4. Complete business verification:
   - Upload valid ID (Driver's License, Passport, or Government ID)
   - Business documents (DTI, SEC, or Mayor's Permit if registered)
   - For personal use: Just valid ID is enough

## Step 2: Get Your API Keys (2 minutes)

1. Login to PayMongo Dashboard
2. Go to **Developers** → **API Keys**
3. You'll see two sets of keys:
   - **Test Keys** (for development): `pk_test_...` and `sk_test_...`
   - **Live Keys** (for production): `pk_live_...` and `sk_live_...`

## Step 3: Add Keys to Environment Variables

### Local Development (.env.local)
```bash
PAYMONGO_SECRET_KEY=sk_test_YOUR_TEST_SECRET_KEY
PAYMONGO_PUBLIC_KEY=pk_test_YOUR_TEST_PUBLIC_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Vercel Production
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add the following:
   - **Variable**: `PAYMONGO_SECRET_KEY`  
     **Value**: `sk_live_YOUR_LIVE_SECRET_KEY`
   - **Variable**: `PAYMONGO_PUBLIC_KEY`  
     **Value**: `pk_live_YOUR_LIVE_PUBLIC_KEY`
   - **Variable**: `NEXT_PUBLIC_APP_URL`  
     **Value**: `https://quizgod-swart.vercel.app`

## Step 4: Configure Webhook (Important!)

Webhooks notify your app when payments are successful.

### For Production (Vercel):
1. In PayMongo Dashboard → **Developers** → **Webhooks**
2. Click **Create Webhook**
3. Enter webhook URL: `https://quizgod-swart.vercel.app/api/webhook/stripe`
4. Select events:
   - ✅ `payment.paid`
   - ✅ `payment.failed`
5. Copy the **Webhook Secret** (starts with `whsec_...`)
6. Add to Vercel env vars:
   - Variable: `PAYMONGO_WEBHOOK_SECRET`
   - Value: `whsec_...your_secret`

### For Local Testing:
PayMongo doesn't have a CLI like Stripe, so test payments locally by:
1. Using test mode API keys
2. Deploy to Vercel staging for full webhook testing
3. Or use ngrok: `ngrok http 3000` and use the ngrok URL for webhooks

## Step 5: Test Payment Flow

### Test Card Numbers (Test Mode Only):
- **Success**: 4343434343434345 (any future expiry, any CVV)
- **Declined**: 4571736000000075
- **Insufficient funds**: 4571736000001234

### Test GCash:
- In test mode, any GCash number will work
- Enter any valid mobile number format: 09123456789

### Test Process:
1. Start dev server: `npm run dev`
2. Sign in to your app
3. Click "Upgrade to Premium"
4. Choose payment method:
   - **Card**: Use test card 4343434343434345
   - **GCash**: Enter test number, approve in test modal
5. Complete payment
6. You should redirect to success page
7. Check Firebase - user's `isPremium` should be `true`

## Pricing

Current pricing in `src/lib/stripe.ts`:
```typescript
export const PREMIUM_PRICE_PHP = 499; // ₱4.99 in centavos
```

To change pricing:
- 1 peso = 100 centavos
- ₱4.99 = 499 centavos
- ₱9.99 = 999 centavos
- ₱49.99 = 4999 centavos

## Payment Methods Supported

PayMongo automatically enables:
- 💳 Credit/Debit Cards (Visa, Mastercard)
- 📱 GCash
- 💰 PayMaya
- 🚗 GrabPay
- 🏦 BPI Online Banking (in some plans)

## Fees

PayMongo transaction fees (as of 2024):
- **Cards**: 3.5% + ₱15 per transaction
- **GCash**: 2.5% + ₱10 per transaction
- **PayMaya**: 2.5% + ₱10 per transaction

Example: ₱4.99 sale via GCash = ₱4.99 - (₱0.12 + ₱10) = You receive ~₱-5.13 (loss)

**Recommendation**: Price at ₱49 or higher to make fees worthwhile:
- ₱49 via GCash = ₱49 - (₱1.23 + ₱10) = You receive ₱37.77 (23% fee)
- ₱99 via GCash = ₱99 - (₱2.48 + ₱10) = You receive ₱86.52 (13% fee)

## Going Live

1. Complete business verification in PayMongo dashboard
2. Switch to live API keys in Vercel environment variables
3. Update webhook URL to production domain
4. Test with small real payment first (₱1-10)
5. Monitor dashboard for successful transactions

## Troubleshooting

### Payment not updating user status
- Check webhook is configured correctly
- Verify webhook secret matches in env vars
- Check Vercel logs: `vercel logs` command
- Look in PayMongo Dashboard → Webhooks → Events for errors

### Checkout session not creating
- Verify `PAYMONGO_SECRET_KEY` is set
- Check amount is in centavos (not pesos)
- Ensure user email and userId are passed correctly

### "Payment provider not available"
- Check if in Philippines (PayMongo only works in PH)
- For international testing, use VPN to Philippines
- Or use test mode which works anywhere

## Support

- PayMongo Docs: https://developers.paymongo.com/docs
- PayMongo Support: support@paymongo.com
- Dashboard: https://dashboard.paymongo.com
