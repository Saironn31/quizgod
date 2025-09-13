"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "../../components/ThemeToggle";
import { useAuth } from '@/contexts/AuthContext';
import { 
  getUserSubjects, 
  FirebaseSubject, 
  createQuiz,
  createSubject,
  getUserClasses,
  migrateLocalDataToFirestore
} from '@/lib/firestore';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type Question = { question: string; options: string[]; correct: number };

interface ExtendedFirebaseSubject extends FirebaseSubject {
  source?: 'personal' | 'class';
  className?: string;
}

export default function CreatePage() {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([{ question: "", options: ["", "", "", ""], correct: 0 }]);
  const [subjects, setSubjects] = useState<ExtendedFirebaseSubject[]>([]);
  const [saving, setSaving] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    
    const loadSubjects = async () => {
      try {
        // Check if migration is needed
        const hasLocalData = localStorage.getItem("qg_all_classes") || 
                           localStorage.getItem(`qg_user_classes_${user.email}`) ||
                           localStorage.getItem("qg_personal_subjects");
        
        if (hasLocalData && !localStorage.getItem(`qg_migrated_${user.uid}`)) {
          setMigrating(true);
          try {
            await migrateLocalDataToFirestore(user.uid, user.email || '');
            localStorage.setItem(`qg_migrated_${user.uid}`, 'true');
          } catch (error) {
            console.warn('Migration failed, continuing with Firebase data:', error);
          }
          setMigrating(false);
        }
        
        // Load personal subjects from Firebase
        const userSubjects = await getUserSubjects(user.uid);
        
        // Load class subjects from classes user is a member of
        const userClasses = await getUserClasses(user.uid);
        const classSubjects: ExtendedFirebaseSubject[] = [];
        const seenSubjects = new Set(userSubjects.map(s => s.name.toLowerCase()));
        
        // Get subjects from all user's classes
        for (const classData of userClasses) {
          const classSubjectsQuery = query(
            collection(db, 'subjects'),
            where('classId', '==', classData.id)
          );
          
          const snapshot = await getDocs(classSubjectsQuery);
          
          snapshot.docs.forEach(doc => {
            const subjectData = doc.data() as FirebaseSubject;
            if (!seenSubjects.has(subjectData.name.toLowerCase())) {
              classSubjects.push({
                ...subjectData,
                id: doc.id,
                source: 'class',
                className: classData.name
              } as ExtendedFirebaseSubject);
              seenSubjects.add(subjectData.name.toLowerCase());
            }
          });
        }
        
        // Combine personal and class subjects
        const personalSubjects = userSubjects.map(s => ({ ...s, source: 'personal' as const }));
        const allSubjects = [...personalSubjects, ...classSubjects];
        setSubjects(allSubjects);
      } catch (error) {
        console.error('Error loading subjects:', error);
      }
    };
    
    loadSubjects();
  }, [user]);

  const addQuestion = () => setQuestions([...questions, { question: "", options: ["", "", "", ""], correct: 0 }]);
  const updateQ = (i:number, patch: Partial<Question>) => setQuestions(qs => qs.map((q,idx)=> idx===i? { ...q, ...patch }: q));

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const save = async () => {
    if (!title.trim()) return alert("Title required");
    if (!subject) return alert("Please select a subject");
    if (!user) return alert("You must be logged in.");
    
    const incompleteQuestions = questions.filter(q => !q.question.trim() || q.options.some(opt => !opt.trim()));
    if (incompleteQuestions.length > 0) {
      return alert("Please complete all questions and their options");
    }

    try {
      setSaving(true);
      
      // Create the quiz in Firebase
      const quizData = {
        title: title.trim(),
        subject,
        description: description.trim() || undefined,
        questions,
        userId: user.uid,
        isPersonal: true
      };
      
      const quizId = await createQuiz(quizData);
      
      alert("Quiz created successfully!");
      window.location.href = "/quizzes";
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert('Failed to create quiz. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
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
          <Link href="/" className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
            🧠 QuizGod
          </Link>
          <div className="hidden lg:flex items-center space-x-4">
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
            <span className="text-gray-700 dark:text-gray-300 text-sm truncate max-w-32">Welcome, {user.email}!</span>
            <button
              onClick={() => {
                window.location.href = "/";
              }}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 text-sm"
            >
              Logout
            </button>
          </div>
          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center gap-2">
            <ThemeToggle />
            <Link href="/" className="text-sm bg-purple-500 text-white px-3 py-2 rounded">Menu</Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-gray-700 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200">✏️ Create New Quiz</h1>
              {migrating && (
                <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-2 rounded-lg mt-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-800 dark:border-blue-200"></div>
                  <span className="text-sm">Migrating data...</span>
                </div>
              )}
            </div>
          </div>

          {/* Quiz Metadata */}
          <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-lg border border-purple-200 dark:border-purple-700">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">📋 Quiz Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                  {subjects.map(s=> (
                    <option key={s.id} value={s.name}>
                      {s.source === 'class' ? `${s.name} (${s.className})` : s.name}
                    </option>
                  ))}
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
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200">❓ Questions ({questions.length})</h2>
              <button 
                onClick={addQuestion} 
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-teal-600 transition-all duration-200 shadow-lg text-sm sm:text-base"
              >
                ➕ Add Question
              </button>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {questions.map((q,i)=> (
                <div key={i} className="bg-white dark:bg-gray-700 rounded-lg p-4 sm:p-6 border border-purple-100 dark:border-gray-600 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                    <h3 className="text-base sm:text-lg font-medium text-gray-800 dark:text-gray-200">Question {i+1}</h3>
                    {questions.length > 1 && (
                      <button 
                        onClick={() => removeQuestion(i)}
                        className="w-full sm:w-auto px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {q.options.map((opt, oi)=> (
                      <div key={oi} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Option {oi+1} {q.correct===oi && <span className="text-green-500 font-semibold">(✓ Correct)</span>}
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
                            className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
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
          <div className="flex justify-center sm:justify-end">
            <button 
              onClick={save} 
              disabled={saving}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 shadow-lg text-sm sm:text-base disabled:opacity-50"
            >
              {saving ? '💾 Saving...' : '💾 Save Quiz'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}