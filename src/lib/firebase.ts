// Firebase configuration for QuizGod
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMtgDBQWnP3d6EP7Dwddq60uWq4eTGOBk",
  authDomain: "quizgod-app.firebaseapp.com",
  projectId: "quizgod-app",
  storageBucket: "quizgod-app.firebasestorage.app",
  messagingSenderId: "1018312112314",
  appId: "1:1018312112314:web:2ff891ff4883a0628b2a83",
  measurementId: "G-BX0J8S3H42"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;