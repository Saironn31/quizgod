﻿"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";interface Quiz {
  title: string;
  subject: string;
  description?: string;
  questions: { question: string; options: string[]; correct: number }[];
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<{ key: string; quiz: Quiz }[]>([]);

  useEffect(() => {
    const username = localStorage.getItem("qg_user");
    if (!username) return;
    const keys = Object.keys(localStorage).filter(k => k.startsWith(`qg_quiz_${username}_`));
    const loaded = keys.map(k => ({ key: k, quiz: JSON.parse(localStorage.getItem(k)!) }));
    setQuizzes(loaded);
  }, []);

  const handleDelete = (key: string) => {
    localStorage.removeItem(key);
    setQuizzes(quizzes.filter(q => q.key !== key));
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Quizzes</h1>
        <Link href="/" className="text-purple-400">Back</Link>
      </div>

      {quizzes.length === 0 ? (
        <p>No quizzes yet. <Link href="/create" className="underline">Create one</Link>.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {quizzes.map(({ key, quiz }) => (
            <div key={key} className="bg-white/10 rounded p-4">
              <h3 className="text-xl font-semibold">{quiz.title}</h3>
              <p className="text-sm opacity-80">{quiz.subject}</p>
              {quiz.description && <p className="mt-2 text-sm">{quiz.description}</p>}
              <p className="mt-2 text-sm">Questions: {quiz.questions.length}</p>
              <div className="mt-3 flex gap-2">
                <Link href={`/quizzes/${key}`} className="px-3 py-1 bg-green-600 rounded">Play</Link>
                <button onClick={() => handleDelete(key)} className="px-3 py-1 bg-red-600 rounded">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
