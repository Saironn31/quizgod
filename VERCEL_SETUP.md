# Vercel Deployment Instructions for QuizGod

## Firebase Environment Variables Setup

To deploy QuizGod to Vercel, you need to configure Firebase environment variables. Follow these steps:

### 1. Get Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your `quizgod-app` project
3. Click on "Project Settings" (gear icon)
4. Scroll down to "Your apps" section
5. Find your web app configuration

### 2. Add Environment Variables to Vercel
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your QuizGod project
3. Go to **Settings** → **Environment Variables**
4. Add the following variables for **Production**, **Preview**, and **Development**:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAMtgDBQWnP3d6EP7Dwddq60uWq4eTGOBk
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=quizgod-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=quizgod-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=quizgod-app.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1018312112314
NEXT_PUBLIC_FIREBASE_APP_ID=1:1018312112314:web:2ff891ff4883a0628b2a83
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-BX0J8S3H42
```

### 3. Deploy
1. Commit and push your changes to GitHub
2. Vercel will automatically redeploy with the new environment variables
3. Your QuizGod app should now work on Vercel!

### Security Notes
- These environment variables are safe to expose publicly as they're client-side Firebase config
- Firebase security is handled by Firestore security rules, not by hiding these values
- The `NEXT_PUBLIC_` prefix makes them available in the browser

### Troubleshooting
- If deployment still fails, check that all environment variables are set correctly
- Ensure your Firebase project is active and billing is enabled (if required)
- Check Firebase Console for any project-specific issues