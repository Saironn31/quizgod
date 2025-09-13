"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { updateUserProfile } from '@/lib/firestore';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);
  const { user, userProfile } = useAuth();

  useEffect(() => {
    setMounted(true);
    
    // Load theme priority: 1. User profile, 2. localStorage, 3. System preference
    if (userProfile?.preferences?.theme) {
      setTheme(userProfile.preferences.theme);
    } else {
      const savedTheme = localStorage.getItem('qg_theme') as Theme;
      if (savedTheme) {
        setTheme(savedTheme);
      } else {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
      }
    }
  }, [userProfile]);

  useEffect(() => {
    if (!mounted) return;
    
    // Apply theme to document
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('qg_theme', theme);
    
    // Sync with user profile if logged in
    if (user && userProfile) {
      const currentUserTheme = userProfile.preferences?.theme;
      if (currentUserTheme && currentUserTheme !== theme) {
        // Don't update if theme hasn't actually changed to avoid infinite loops
        return;
      }
      
      if (!userProfile.preferences || userProfile.preferences.theme !== theme) {
        updateUserProfile(user.uid, {
          preferences: {
            ...(userProfile.preferences || {}),
            theme
          }
        }).catch(console.error);
      }
    }
  }, [theme, mounted, user, userProfile]);

  const toggleTheme = () => {
    if (!mounted) return; // Prevent theme changes before mount
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
