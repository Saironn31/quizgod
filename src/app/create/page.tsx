"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "../../components/ThemeToggle";

type Question = { question: string; options: string[]; correct: number };

export default function CreatePage() {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([{ question: "", options: ["", "", "", ""], correct: 0 }]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    const user = localStorage.getItem("qg_user");
    if (!user) {
      window.location.href = "/";
      return;
    }
    setCurrentUser(user);
  }, []);

  useEffect(()=>{
    if (!currentUser) return;
    const storedSubjects = JSON.parse(localStorage.getItem(`qg_subjects_${currentUser}`)||"[]");
    // Extract subject names from objects
    const subjectNames = storedSubjects.map((s: any) => typeof s === 'string' ? s : s.name);
    setSubjects(subjectNames);
  },[currentUser]);

  const addQuestion = () => setQuestions([...questions, { question: "", options: ["", "", "", ""], correct: 0 }]);
  const updateQ = (i:number, patch: Partial<Question>) => setQuestions(qs => qs.map((q,idx)=> idx===i? { ...q, ...patch }: q));

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const save = () => {
    if (!title.trim()) return alert("Title required");
    if (!subject) return alert("Please select a subject");
    if (!currentUser) return alert("You must be logged in.");
    
    const incompleteQuestions = questions.filter(q => !q.question.trim() || q.options.some(opt => !opt.trim()));
    if (incompleteQuestions.length > 0) {
      return alert("Please complete all questions and their options");
    }

    const quiz = { title: title.trim(), subject, description: description.trim(), questions, createdAt: new Date().toISOString() };
    const key = `qg_quiz_${currentUser}_${Date.now()}`;
    localStorage.setItem(key, JSON.stringify(quiz));

    // Auto-share with user's classes
    const allClasses = JSON.parse(localStorage.getItem("qg_all_classes") || "[]");
    const userClasses = allClasses.filter((classInfo: any) => 
      classInfo.members && classInfo.members.includes(currentUser)
    );

    userClasses.forEach((classInfo: any) => {
      const classQuizzes = JSON.parse(localStorage.getItem(`qg_class_quizzes_${classInfo.id}`) || "[]");
      if (!classQuizzes.includes(key)) {
        classQuizzes.push(key);
        localStorage.setItem(`qg_class_quizzes_${classInfo.id}`, JSON.stringify(classQuizzes));
      }
    });

    if (userClasses.length > 0) {
      alert(`Quiz created and shared with ${userClasses.length} class${userClasses.length !== 1 ? 'es' : ''}!`);
    } else {
      alert("Quiz created successfully!");
    }

    window.location.href = "/quizzes";
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Please log in to create quizzes</h1>
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm border-b border-purple-100 dark:border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            🧠 QuizGod
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/create" className="text-purple-600 dark:text-purple-400 font-semibold">
              Create Quiz
            </Link>
            <Link href="/subjects" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400">
              Subjects
            </Link>
            <Link href="/quizzes" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400">
              My Quizzes
            </Link>
            <Link href="/classes" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400">
              Classes
            </Link>
            <Link href="/ai-quiz" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400">
              Smart Quiz
            </Link>
            <ThemeToggle />
            <span className="text-gray-700 dark:text-gray-300">Welcome, {currentUser}!</span>
            <button
              onClick={() => {
                localStorage.removeItem("qg_user");
                window.location.href = "/";
              }}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-gray-700 p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">✏️ Create New Quiz</h1>
          </div>

          {/* Quiz Metadata */}
          <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-lg border border-purple-200 dark:border-purple-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">📋 Quiz Information</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quiz Title *</label>
                <input 
                  className="w-full p-3 border border-purple-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400" 
                  placeholder="Enter quiz title..." 
                  value={title} 
                  onChange={e=>setTitle(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject *</label>
                <select 
                  className="w-full p-3 border border-purple-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400" 
                  value={subject} 
                  onChange={e=>setSubject(e.target.value)}
                >
                  <option value="">Select subject</option>
                  {subjects.map(s=> <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description (Optional)</label>
              <textarea 
                className="w-full p-3 border border-purple-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400" 
                rows={3} 
                placeholder="Brief description of your quiz..." 
                value={description} 
                onChange={e=>setDescription(e.target.value)} 
              />
            </div>
          </div>

          {/* Questions Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">❓ Questions ({questions.length})</h2>
              <button 
                onClick={addQuestion} 
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-teal-600 transition-all duration-200 shadow-lg"
              >
                ➕ Add Question
              </button>
            </div>

            <div className="space-y-6">
              {questions.map((q,i)=> (
                <div key={i} className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-purple-100 dark:border-gray-600 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Question {i+1}</h3>
                    {questions.length > 1 && (
                      <button 
                        onClick={() => removeQuestion(i)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                      >
                        🗑️ Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Question Text *</label>
                    <input 
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400" 
                      placeholder="Enter your question..." 
                      value={q.question} 
                      onChange={e=>updateQ(i,{question:e.target.value})} 
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {q.options.map((opt, oi)=> (
                      <div key={oi} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Option {oi+1} {q.correct===oi && <span className="text-green-500 font-semibold">(✓ Correct Answer)</span>}
                        </label>
                        <div className="flex gap-2">
                          <input 
                            className="flex-1 p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400" 
                            placeholder={`Enter option ${oi+1}...`}
                            value={opt} 
                            onChange={e=>{ const opts=[...q.options]; opts[oi]=e.target.value; updateQ(i,{options:opts}); }} 
                          />
                          <button 
                            type="button" 
                            className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                              q.correct === oi 
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                            }`}
                            onClick={()=>updateQ(i,{correct:oi})}
                          >
                            {q.correct === oi ? '✓' : 'Set'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button 
              onClick={save} 
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 shadow-lg"
            >
              💾 Save Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
