"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";

export default function NavBar() {
  const username = typeof window !== "undefined" ? localStorage.getItem("qg_user") : "";
  const handleLogout = () => {
    localStorage.removeItem("qg_user");
    window.location.reload();
  };
  return (
    <nav className="flex items-center gap-6">
      <span className="font-semibold text-purple-200 dark:text-purple-300">{username}</span>
      <Link href="/create" className="hover:underline text-white dark:text-gray-200">Create Quiz</Link>
      <Link href="/ai-quiz" className="hover:underline text-yellow-300 dark:text-yellow-400">🤖 AI Quiz</Link>
      <Link href="/subjects" className="hover:underline text-white dark:text-gray-200">Subjects</Link>
      <Link href="/quizzes" className="hover:underline text-white dark:text-gray-200">My Quizzes</Link>
      <Link href="/classes" className="hover:underline text-green-300 dark:text-green-400">👥 Classes</Link>
      <ThemeToggle />
      <button onClick={handleLogout} className="ml-4 px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700">Logout</button>
    </nav>
  );
}
