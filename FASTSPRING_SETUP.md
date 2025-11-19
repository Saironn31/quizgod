# FastSpring Setup Guide for QuizGod

FastSpring is a merchant of record - they handle all payments, taxes, and compliance for you globally. No business registration required!

## Why FastSpring?

✅ **No business registration needed** - Works with personal accounts  
✅ **Global coverage** - Accepts payments from 200+ countries  
✅ **All payment methods** - Cards, PayPal, bank transfers, local methods  
✅ **Tax handling** - FastSpring handles all VAT/sales tax automatically  
✅ **Compliance** - They are the merchant of record, not you  
✅ **Works in Philippines** - Accepts GCash via PayPal integration  

## Step 1: Create FastSpring Account (10 minutes)

1. Go to: **https://fastspring.com/sign-up/**
2. Choose "Get Started"
3. Fill in your details:
   - Personal or Business name
   - Email address
   - Country: Philippines
   - Tax information (they handle it, you just need to provide your details)
4. You'll get instant test account access
5. Production access requires verification (1-2 business days)

## Step 2: Create Your Product (5 minutes)

1. Login to FastSpring Dashboard
2. Go to **Products** → **Add Product**
3. Fill in product details:
   - **Product Name**: QuizGod Premium
   - **Display Name**: QuizGod Premium - Lifetime Access
   - **Pricing**: $4.99 USD (or set your own price)
   - **Fulfillment**: Automatically fulfilled (digital product)
4. Under **Product Path**, note the path (e.g., `quizgod-premium`)
5. Save the product

## Step 3: Configure Storefront (Already Done!)

Your storefront is already configured in the code:
- **Test Storefront**: `quizgod.test.onfastspring.com/popup-quizgod`
- **Live Storefront**: Will be `quizgod.onfastspring.com/popup-quizgod` (after approval)

The script is already loaded in `src/app/layout.tsx`.

## Step 4: Set Up Webhook (Important!)

Webhooks automatically grant premium access when someone pays.

### For Production (Vercel):
1. In FastSpring Dashboard → **Integrations** → **Webhooks**
2. Click **Add Webhook URL**
3. Enter: `https://quizgod-swart.vercel.app/api/webhook/fastspring`
4. Select events:
   - ✅ `order.completed`
   - ✅ `subscription.activated`
   - ✅ `subscription.canceled`
5. Save

### For Local Testing:
1. Use ngrok: `ngrok http 3000`
2. Add ngrok URL to FastSpring webhooks: `https://your-ngrok-url.ngrok.io/api/webhook/fastspring`
3. Test orders will trigger webhooks to your local machine

## Step 5: Update Product Path in Code

You need to tell FastSpring which product to sell. In FastSpring dashboard, copy your product path.

Then update your storefront URL format:
```
quizgod.test.onfastspring.com/popup-quizgod?products=YOUR-PRODUCT-PATH
```

Or programmatically in the code when opening checkout:
```javascript
window.fastspring.builder.push({
  products: [{ path: 'quizgod-premium' }]  // Your product path
});
```

## Step 6: Test the Flow

1. Start your app: `npm run dev`
2. Sign in to your account
3. Click "Upgrade to Premium"
4. A FastSpring popup will appear
5. Use test card:
   - **Card**: 4111111111111111
   - **Expiry**: Any future date
   - **CVV**: Any 3 digits
   - **Name**: Test User
6. Complete checkout
7. Check Firebase - your user's `isPremium` should be `true`

## Payment Methods Available

FastSpring automatically supports:
- 💳 Credit/Debit Cards (Visa, Mastercard, Amex)
- 💰 PayPal (includes PayPal balance & bank transfers)
- 🏦 Wire Transfer (for higher amounts)
- 🌍 Local payment methods based on customer country:
  - **Brazil**: Boleto
  - **Germany**: SEPA Direct Debit, Sofort
  - **Netherlands**: iDEAL
  - **Many more**: 40+ local payment methods

### For Philippines Users:
FastSpring supports PayPal, which accepts:
- GCash (via PayPal)
- Credit/Debit Cards
- PayPal Balance

## Pricing & Fees

FastSpring fees (as of 2024):
- **8.9% + $0.95** per transaction (includes payment processing, tax handling, fraud protection)
- They handle all tax collection and remittance
- No monthly fees
- No setup fees

**Example with $4.99 sale:**
- Sale: $4.99
- FastSpring fee: ~$1.39
- You receive: ~$3.60

**Recommendation**: Price at $9.99 or higher for better margins:
- $9.99 sale = You keep ~$7.90 (79%)
- $19.99 sale = You keep ~$16.77 (84%)

## Going Live

1. Complete FastSpring account verification (provide ID, tax info)
2. Wait for approval (1-2 business days)
3. Update script in `layout.tsx` to production storefront:
   ```tsx
   data-storefront="quizgod.onfastspring.com/popup-quizgod"
   ```
4. Update environment variable:
   ```
   NEXT_PUBLIC_FASTSPRING_STOREFRONT=quizgod.onfastspring.com/popup-quizgod
   ```
5. Test with real payment (small amount first)
6. Monitor FastSpring dashboard for orders

## Multi-Currency Support

FastSpring automatically:
- Detects customer location
- Shows price in their local currency
- Handles currency conversion
- Collects appropriate taxes (VAT, GST, etc.)

Example: You set $4.99 USD, customers see:
- 🇵🇭 Philippines: ₱280 PHP
- 🇪🇺 Europe: €4.49 EUR
- 🇬🇧 UK: £3.99 GBP
- 🇯🇵 Japan: ¥750 JPY

## Advantages Over Other Platforms

| Feature | FastSpring | PayMongo | Stripe | PayPal |
|---------|-----------|----------|--------|--------|
| Business registration required | ❌ No | ✅ Yes (DTI) | ⚠️ Sometimes | ❌ No |
| Handles taxes | ✅ Yes | ❌ No | ❌ No | ⚠️ Partial |
| Global support | ✅ 200+ countries | ❌ PH only | ✅ 40+ countries | ✅ Global |
| Local payments PH | ⚠️ Via PayPal | ✅ GCash/Maya | ❌ Limited | ✅ Yes |
| Setup time | 2 days | 1-2 weeks | Hours | Instant |
| Fees | 8.9% + $0.95 | 2.5% + ₱10 | 3.5% + $0.30 | 4.4% + $0.30 |

## Troubleshooting

### Checkout popup not appearing
- Check browser console for errors
- Verify FastSpring script is loaded: `console.log(window.fastspring)`
- Clear cache and reload
- Check if popup blocker is enabled

### Premium not granted after payment
- Check webhook is configured in FastSpring dashboard
- Verify webhook URL is correct and accessible
- Check Vercel logs: `vercel logs`
- Look in FastSpring Dashboard → Webhooks → Event Log

### "Product not found" error
- Verify product path matches in FastSpring dashboard
- Check product is active
- Ensure product is added to storefront

### Test mode vs Production
- Test storefront: `*.test.onfastspring.com`
- Production storefront: `*.onfastspring.com`
- Don't forget to switch when going live!

## Support

- FastSpring Docs: https://fastspring.com/docs/
- FastSpring Support: support@fastspring.com
- Dashboard: https://dashboard.fastspring.com/
- Status: https://status.fastspring.com/

## Getting Paid

1. FastSpring holds funds for 7-30 days (fraud protection)
2. They transfer to your bank account monthly
3. Minimum payout: $50 USD
4. Supports PayPal, Wire Transfer, or ACH (US)
5. For Philippines: Best to use PayPal or Wire Transfer
