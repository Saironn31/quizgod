import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let app: App | undefined;

export function adminApp() {
  if (!app && getApps().length === 0) {
    // For Vercel deployment, we'll use environment variables
    // You'll need to add these to your Vercel project settings
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    app = initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
  }
  
  return app || getApps()[0];
}

export function adminDb() {
  return getFirestore(adminApp());
}
