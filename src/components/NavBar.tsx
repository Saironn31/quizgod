"use client";
import Link from "next/link";
import React from "react";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from '@/contexts/AuthContext';

export default function NavBar() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <nav className="flex items-center gap-6">
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
    </nav>
  );
}
