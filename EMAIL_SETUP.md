# Email Setup Guide

## Welcome Email on User Signup

The app now automatically sends a welcome email when users sign up using Firebase Authentication triggers.

## How It Works

1. **Trigger**: When a user creates an account, the `sendWelcomeEmail` Firebase Function is automatically triggered
2. **Queue**: Email data is stored in Firestore `mail` collection
3. **Delivery**: An email extension processes the queue and sends the email

## Setup Options

### Option 1: Firebase Email Extension (Recommended - Easiest)

1. **Install the Trigger Email extension from Firebase Console:**
   ```bash
   firebase ext:install firebase/firestore-send-email
   ```

2. **Configure during installation:**
   - SMTP Connection URI: Your email provider's SMTP URI
   - Email documents collection: `mail`
   - Default FROM address: `noreply@yourdomain.com`
   - Default Reply-To address: `support@yourdomain.com`

3. **SMTP Providers (Choose one):**

   **Mailgun (Recommended):**
   - Sign up at https://mailgun.com
   - **Free Tier**: 100 emails/day (~3,000/month) - FREE FOREVER
   - **Foundation Plan**: First month free trial, then $35/month for 50,000 emails
   - Get SMTP credentials from Sending > Domain Settings > SMTP credentials
   - SMTP URI: `smtps://postmaster@YOUR_DOMAIN.mailgun.org:YOUR_PASSWORD@smtp.mailgun.org:465`
   - **Setup Steps**:
     1. Create account and verify email
     2. Add and verify your sending domain (or use sandbox for testing)
     3. Go to Sending > Domains > Select your domain
     4. Click "SMTP credentials" tab
     5. Copy username (postmaster@...) and password
     6. Use format: `smtps://USERNAME:PASSWORD@smtp.mailgun.org:465`
   - **Note**: Free tier is perfect for testing and small apps. Upgrade when you exceed 100 emails/day.

   **Alternative: Brevo/Sendinblue (Better free tier for volume):**
   - Sign up at https://brevo.com
   - **Free Tier**: 300 emails/day (9,000/month) - FREE FOREVER
   - Better for apps with higher signup volume
   - SMTP URI: `smtps://YOUR_EMAIL:YOUR_SMTP_KEY@smtp-relay.brevo.com:465`

   **Alternative: Gmail (testing only):**
   - Enable 2FA on your Google account
   - Create App Password: https://myaccount.google.com/apppasswords
   - SMTP URI: `smtps://your-email@gmail.com:YOUR_APP_PASSWORD@smtp.gmail.com:465`
   - Note: 500 emails/day limit, not recommended for production

### Option 2: Custom Email Service (More Control)

If you prefer a different email service:

1. **Create a Cloud Function to watch the `mail` collection:**
   ```typescript
   export const processMailQueue = functions.firestore
     .document('mail/{mailId}')
     .onCreate(async (snap, context) => {
       const mailData = snap.data();
       // Send email using your preferred service (SendGrid API, etc.)
       // Mark as delivered: await snap.ref.update({ delivery: { state: 'SUCCESS' } });
     });
   ```

2. **Use SendGrid API directly:**
   ```bash
   npm install @sendgrid/mail --prefix functions
   ```

3. **Update the function:**
   ```typescript
   import sgMail from '@sendgrid/mail';
   sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
   
   await sgMail.send({
     to: mailData.to,
     from: 'noreply@yourdomain.com',
     subject: mailData.message.subject,
     html: mailData.message.html
   });
   ```

## Email Template

The welcome email includes:
- Personalized greeting with user's name
- QuizGod branding with gradient header
- List of key features
- Call-to-action button
- Responsive HTML design
- Plain text fallback

## Testing

1. **Deploy the function:**
   ```bash
   cd functions
   npm run build
   firebase deploy --only functions
   ```

2. **Test with a new account:**
   - Sign up with a real email address
   - Check email inbox (and spam folder)
   - Verify email appearance and links

3. **Check logs:**
   ```bash
   firebase functions:log
   ```

## Customization

### Update Email Content

Edit `functions/src/index.ts` in the `sendWelcomeEmail` function:

```typescript
// Change subject
subject: 'Your Custom Subject'

// Update HTML template
html: `...your custom HTML...`

// Update text fallback
text: `...your custom text...`
```

### Add User's Name

The template uses `user.displayName` which is typically empty on signup. To show the actual name:

1. **Update AuthModal.tsx** to set displayName:
   ```typescript
   const userCredential = await signup(email, password);
   await updateProfile(userCredential.user, { displayName: name });
   ```

2. **Or** fetch from Firestore user profile in the function

### Change Email Sender

Update the `from` field in the email or set it in Firebase extension config.

## Cost Considerations

- **Firebase Function**: Free tier covers most usage (2M invocations/month)
- **Mailgun**: 
  - Free tier: 100 emails/day (~3,000/month) - Forever free
  - Foundation plan: $35/month for 50,000 emails (first month free trial)
  - Overage: $1.30 per 1,000 emails beyond plan limit
- **Brevo (alternative)**: 300 emails/day (9,000/month) free forever - Better for higher volume startups

## Troubleshooting

**Email not received:**
1. Check Firebase Console > Functions logs
2. Verify Firestore has `mail` collection with new documents
3. Check email provider's dashboard for delivery status
4. Verify SMTP credentials are correct
5. Check spam folder

**Function not triggering:**
1. Ensure function is deployed: `firebase deploy --only functions`
2. Check Firebase Console > Functions to see if it's listed
3. Verify Firebase Authentication is working

**Rate limits:**
- Mailgun free tier: 100 emails/day (forever free)
- Brevo free tier: 300 emails/day (better for growth)
- Monitor usage in provider dashboard
- Set up billing alerts to avoid surprises
- Upgrade to paid plan when consistently exceeding daily limits

## Security Notes

- Never commit SMTP credentials to Git
- Use Firebase Console environment config or Google Cloud Secret Manager
- Set up SPF/DKIM records for custom domains
- Use environment variables for sensitive data

## Next Steps

1. Choose email provider and get credentials
2. Install Firebase email extension OR implement custom solution
3. Deploy functions: `firebase deploy --only functions`
4. Test with a real signup
5. Monitor logs and email delivery
6. Customize template to match your branding
