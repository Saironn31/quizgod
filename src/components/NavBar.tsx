"use client";
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from '@/contexts/AuthContext';

export default function NavBar() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await logout();
      setIsMenuOpen(false); // Close menu after logout
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <nav className="relative" ref={menuRef}>
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-6">
        <span className="font-semibold text-purple-200 dark:text-purple-300">
          {user?.email || 'Guest'}
        </span>
        <Link href="/create" className="hover:underline text-white dark:text-gray-200">Create Quiz</Link>
        <Link href="/ai-quiz" className="hover:underline text-yellow-300 dark:text-yellow-400">🤖 AI Quiz</Link>
        <Link href="/subjects" className="hover:underline text-white dark:text-gray-200">Subjects</Link>
        <Link href="/quizzes" className="hover:underline text-white dark:text-gray-200">My Quizzes</Link>
        <Link href="/classes" className="hover:underline text-green-300 dark:text-green-400">👥 Classes</Link>
        <ThemeToggle />
        <button 
          onClick={handleLogout} 
          className="ml-4 px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-purple-200 dark:text-purple-300 text-sm truncate max-w-32">
            {user?.email || 'Guest'}
          </span>
          <ThemeToggle />
          {/* Hamburger Menu Button */}
          <button
            onClick={toggleMenu}
            className="p-2 text-white hover:bg-white/10 rounded-md transition-colors"
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 py-2 z-50 animate-fade-in">
            <Link 
              href="/create" 
              className="block px-4 py-3 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={closeMenu}
            >
              Create Quiz
            </Link>
            <Link 
              href="/ai-quiz" 
              className="block px-4 py-3 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={closeMenu}
            >
              🤖 AI Quiz
            </Link>
            <Link 
              href="/subjects" 
              className="block px-4 py-3 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={closeMenu}
            >
              Subjects
            </Link>
            <Link 
              href="/quizzes" 
              className="block px-4 py-3 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={closeMenu}
            >
              My Quizzes
            </Link>
            <Link 
              href="/classes" 
              className="block px-4 py-3 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={closeMenu}
            >
              👥 Classes
            </Link>
            <hr className="my-2 border-gray-200 dark:border-gray-600" />
            <button 
              onClick={handleLogout}
              className="block w-full text-left px-4 py-3 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
