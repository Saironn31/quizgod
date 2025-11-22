'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  UserCredential
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile, FirebaseUser } from '@/lib/firestore';

interface AuthContextType {
  user: User | null;
  userProfile: FirebaseUser | null;
  loading: boolean;
  signup: (email: string, password: string) => Promise<UserCredential>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  isPremiumUser: () => boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Sign up function
  const signup = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential;
  };

  // Login function
  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    // Record login date in Firestore
    try {
      await import('@/lib/firestore').then(mod => mod.recordUserLoginDate(cred.user.uid));
    } catch (err) {
      console.error('Failed to record login date:', err);
    }
  };

  // Logout function
  const logout = async () => {
    await signOut(auth);
  };

  // Refresh user profile function
  const refreshUserProfile = async () => {
    if (user) {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
    }
  };

  // Check if user has premium access (either isPremium flag or admin role)
  const isPremiumUser = () => {
    // Admin users always have premium access
    if (userProfile?.role === 'admin') return true;
    
    // Check if premium is active
    return userProfile?.isPremium === true && userProfile?.premiumStatus === 'active';
  };

  // Listen for authentication state changes
  useEffect(() => {
    setMounted(true);
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Auto-grant admin and premium to specific email
        if (user.email === 'johnvaldivieso331@gmail.com') {
          try {
            const { doc, updateDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
              role: 'admin',
              isPremium: true,
              updatedAt: new Date()
            }).catch(() => {
              // User doc might not exist yet, that's ok
            });
          } catch (err) {
            console.error('Failed to auto-grant admin:', err);
          }
        }
        
        // Check and update premium expiry status
        try {
          const { checkAndUpdatePremiumExpiry } = await import('@/lib/firestore');
          await checkAndUpdatePremiumExpiry(user.uid);
        } catch (err) {
          console.error('Failed to check premium expiry:', err);
        }
        
        // Fetch user profile data from Firestore
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    userProfile,
    loading,
    signup,
    login,
    logout,
    refreshUserProfile,
    isPremiumUser
  };

  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};