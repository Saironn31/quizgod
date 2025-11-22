# Welcome Email Setup Guide

## Overview
QuizGod sends automatic welcome emails to new users using Brevo's API through a Next.js API route. This works on **Firebase Spark (free) plan** - no Blaze upgrade needed!

## Why Brevo?
- ✅ **300 emails/day FREE** (vs Mailgun's 100/day)
- ✅ No credit card required
- ✅ Works with Next.js (no Firebase Functions needed)
- ✅ Simple REST API integration

---

## Setup Steps

### 1. Create Brevo Account
1. Visit https://www.brevo.com/
2. Click "Sign up free"
3. Verify your email address
4. Complete account setup

### 2. Get API Key
1. Go to https://app.brevo.com/settings/keys/api
2. Click "Generate a new API key"
3. Name it: **QuizGod Email API**
4. Copy the generated key (starts with `xkeysib-`)
5. Store it securely (you can't see it again!)

### 3. Configure Environment Variable

**For Local Development:**

Add to `.env.local` in project root:
```bash
BREVO_API_KEY=xkeysib-your-api-key-here
```

**For Production (Vercel):**

1. Go to Vercel Dashboard → Your Project
2. Click "Settings" → "Environment Variables"
3. Add new variable:
   - **Name**: `BREVO_API_KEY`
   - **Value**: `xkeysib-your-api-key-here`
   - **Environment**: Production (and Preview if needed)
4. Click "Save"
5. Redeploy your app

### 4. Test the System

1. **Start dev server** (if not running):
   ```bash
   npm run dev
   ```

2. **Create test account**:
   - Open your app
   - Click "Sign Up"
   - Enter real email address (to receive test email)
   - Complete signup

3. **Check email**:
   - Check inbox within 1-2 minutes
   - Check spam/junk folder if not in inbox
   - Email should be personalized with your name

4. **Verify in Brevo dashboard**:
   - Go to https://app.brevo.com/statistics/email
   - Check "Transactional" emails
   - See delivery status

---

## How It Works

```
User Signs Up
    ↓
AuthModal.tsx (frontend)
    ↓
POST /api/send-welcome-email
    ↓
route.ts (Next.js API)
    ↓
Brevo API (HTTPS)
    ↓
Email Delivered to User
```

**Files involved:**
- `/src/app/api/send-welcome-email/route.ts` - API endpoint
- `/src/components/AuthModal.tsx` - Triggers email on signup

---

## Monitoring Usage

### Check Brevo Dashboard
1. Go to https://app.brevo.com/statistics/email
2. View:
   - Emails sent today
   - Delivery rate
   - Open rate
   - Click rate

### Daily Limits (Free Tier)
- 300 emails/day
- ~9,000 emails/month
- Unlimited contacts
- No time limit

### When to Upgrade
If you consistently hit 300 emails/day:
- **Starter**: $25/mo for 20,000 emails/month
- **Business**: $65/mo for 60,000 emails/month

---

## Troubleshooting

### Email Not Received?

1. **Check spam folder** - First-time emails often go to spam
2. **Check Brevo dashboard** - Verify email was sent
3. **Check Next.js logs**:
   ```bash
   # Development
   Check terminal where `npm run dev` is running
   
   # Production (Vercel)
   Go to Vercel Dashboard → Your Project → Functions → Runtime Logs
   ```

4. **Verify API key**:
   ```bash
   # Check if env variable is loaded
   echo $BREVO_API_KEY    # Mac/Linux
   $env:BREVO_API_KEY     # Windows PowerShell
   ```

### Common Errors

**"Email service not configured"**
- BREVO_API_KEY not set in environment
- Restart dev server after adding .env.local
- Redeploy if on Vercel

**"Failed to send email" (401/403)**
- Invalid API key
- API key expired or deleted
- Generate new key from Brevo dashboard

**"Failed to send email" (429)**
- Exceeded 300 emails/day limit
- Wait until next day (UTC time)
- Or upgrade Brevo plan

**Email goes to spam**
- First-time emails often flagged
- For production: Verify your domain in Brevo
- Add SPF/DKIM records to DNS

---

## Production Setup (Optional)

### Verify Sender Domain

For better deliverability, verify your domain:

1. **Go to Brevo**: https://app.brevo.com/senders
2. **Add domain**: `yourdomain.com`
3. **Add DNS records** provided by Brevo:
   - SPF record (TXT)
   - DKIM record (TXT)
   - DMARC record (TXT)
4. **Wait for verification** (can take 24-48 hours)
5. **Update sender email** in code to use your domain

---

## Email Template Customization

Edit `/src/app/api/send-welcome-email/route.ts`:

```typescript
subject: "Welcome to QuizGod! 🎓",  // Change subject
sender: {
  name: "QuizGod Team",              // Change sender name
  email: "noreply@yourdomain.com"    // Change sender email
},
htmlContent: `...`                   // Edit HTML template
```

---

## Future Enhancements

Consider adding more email types:

- ✉️ Email verification
- 🔒 Password reset
- 🎯 Quiz results summary
- 📊 Weekly progress digest
- 💎 Premium upgrade notifications
- 🎉 Achievement unlocked emails

Each would be a new API route following the same pattern.

---

## Alternative: Mailgun

If you prefer Mailgun instead:

**Pros:**
- Good for enterprise
- Reliable delivery

**Cons:**
- Only 100 emails/day free (vs Brevo's 300)
- Requires credit card
- More complex setup

**Setup:** https://www.mailgun.com/

---

## Cost Comparison

| Provider | Free Tier | Paid Plans |
|----------|-----------|------------|
| **Brevo** ✅ | 300/day (9k/month) | $25/mo for 20k |
| Mailgun | 100/day (3k/month) | $35/mo for 50k |
| SendGrid | 100/day | $20/mo for 50k |

**Recommendation**: Stick with Brevo for the best free tier!

---

## Questions?

Check:
- Brevo Documentation: https://developers.brevo.com/
- API Reference: https://developers.brevo.com/reference/sendtransacemail
- QuizGod codebase: `/src/app/api/send-welcome-email/route.ts`
