# Security Guide for QuizGod

## 🔐 Environment Variables Security

### ⚠️ CRITICAL: Never Commit Secrets

The `.env.local` file contains sensitive credentials and should **NEVER** be committed to git.

### Setup Instructions

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your actual credentials** in `.env.local`

3. **Verify it's ignored:**
   ```bash
   git status
   # .env.local should NOT appear
   ```

### If Credentials Were Exposed

If you accidentally committed `.env.local` or exposed API keys:

1. **Immediately rotate all exposed keys:**
   - Firebase: Regenerate API keys in Firebase Console
   - Groq: Create new API key at console.groq.com
   - Paddle: Generate new API key in Paddle Dashboard
   - Firebase Admin: Generate new service account key

2. **Remove from git history:**
   ```bash
   git filter-branch --force --index-filter \
   "git rm --cached --ignore-unmatch .env.local" \
   --prune-empty --tag-name-filter cat -- --all
   
   git push origin --force --all
   ```

3. **Update Vercel environment variables** with new keys

### Vercel Deployment

For production deployment, add environment variables in Vercel Dashboard:

1. Go to your project → Settings → Environment Variables
2. Add each variable individually
3. Set for: Production, Preview, Development
4. **Never use `NEXT_PUBLIC_*` for server-side secrets**

### API Key Best Practices

✅ **DO:**
- Use environment variables for all secrets
- Rotate keys regularly (every 90 days)
- Use different keys for dev/staging/production
- Monitor API usage for anomalies
- Set up rate limiting

❌ **DON'T:**
- Commit `.env.local` to git
- Share keys in Slack/Discord/Email
- Use production keys in development
- Hardcode keys in source code
- Reuse keys across projects

## 🛡️ Server-Side Security

### Premium Feature Protection

Premium features must be validated server-side:

```typescript
// ✅ GOOD: Server-side validation
// In API route: /api/generate-quiz
if (!await isUserPremium(userId)) {
  return res.status(403).json({ error: 'Premium required' });
}

// ❌ BAD: Client-side only
if (!isPremium) {
  alert('Premium required');
  return;
}
```

### Webhook Security

Paddle webhooks should verify signatures:

```typescript
// Verify webhook signature before processing
const signature = req.headers['paddle-signature'];
if (!verifyWebhookSignature(signature, body)) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

### Input Validation

All user inputs must be sanitized:

```typescript
// Sanitize HTML to prevent XSS
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userInput);

// Validate data types
import { z } from 'zod';
const schema = z.object({
  title: z.string().min(1).max(200),
  questions: z.array(z.object({...}))
});
```

## 🔍 Monitoring & Alerts

### Set Up Monitoring

1. **Vercel Analytics:** Monitor performance and errors
2. **Firebase Usage:** Track Firestore reads/writes
3. **API Rate Limits:** Monitor Groq/Paddle API usage
4. **Error Tracking:** Use Sentry or similar service

### Alert Triggers

Set up alerts for:
- Unusual API usage spikes
- Failed payment webhooks
- Authentication failures
- 5xx error rates above threshold

## 📱 API Rate Limiting

Implement rate limiting for public endpoints:

```typescript
// Example with rate-limit middleware
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

export default limiter(handler);
```

## 🔐 Data Privacy

### User Data

- Store minimal personal data
- Hash sensitive information
- Implement data deletion on account closure
- Provide data export functionality
- GDPR compliance for EU users

### Quiz Content

- User quizzes are private by default
- Class quizzes visible only to members
- No public sharing without explicit consent

## 🚨 Incident Response

If a security breach occurs:

1. **Immediate:** Rotate all API keys and credentials
2. **Notify users** within 72 hours (GDPR requirement)
3. **Document the incident** and steps taken
4. **Review and fix** the vulnerability
5. **Update security practices** to prevent recurrence

## 📞 Security Contacts

For security issues, contact:
- GitHub: Open a security advisory
- Email: [Your Security Email]
- Do NOT post security issues publicly

## ✅ Security Checklist

- [ ] All secrets in environment variables
- [ ] `.env.local` not in git
- [ ] Vercel environment variables configured
- [ ] API keys rotated if exposed
- [ ] Rate limiting implemented
- [ ] Input sanitization in place
- [ ] Server-side premium validation
- [ ] Webhook signature verification
- [ ] Error monitoring set up
- [ ] Regular security audits scheduled
