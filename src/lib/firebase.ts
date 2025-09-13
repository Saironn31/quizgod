// Firebase configuration for QuizGod
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Simple encoding to hide API key from plain text view
const decode = (str: string) => {
  return str.split('').map(char => 
    String.fromCharCode(char.charCodeAt(0) - 1)
  ).join('');
};

// Encoded Firebase config (each character shifted by +1)
const config = {
  apiKey: decode("BJa`TzBNuhECRXoQ4e7FQ8ExeeR71vXr5fUHPCl"),
  authDomain: "quizgod-app.firebaseapp.com",
  projectId: "quizgod-app",
  storageBucket: "quizgod-app.firebasestorage.app", 
  messagingSenderId: "1018312112314",
  appId: "1:1018312112314:web:2ff891ff4883a0628b2a83",
  measurementId: "G-BX0J8S3H42"
};

// Initialize Firebase
const app = initializeApp(config);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;