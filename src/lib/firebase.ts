// Firebase configuration for QuizGod
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase config using environment variables with fallbacks for development
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAMtgDBQWnP3d6EP7Dwddq60uWq4eTGOBk",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "quizgod-app.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "quizgod-app",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "quizgod-app.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1018312112314",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1018312112314:web:2ff891ff4883a0628b2a83",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-BX0J8S3H42"
};

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredKeys = ['apiKey', 'authDomain', 'projectId'];
  const missingKeys = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);
  
  if (missingKeys.length > 0) {
    console.error('Missing Firebase configuration:', missingKeys);
    throw new Error(`Missing Firebase configuration: ${missingKeys.join(', ')}`);
  }
};

// Only validate in browser environment
if (typeof window !== 'undefined') {
  validateFirebaseConfig();
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services  
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;