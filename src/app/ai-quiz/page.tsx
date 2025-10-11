"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import SideNav from '@/components/SideNav';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getUserSubjects, 
  getAllUserSubjects,
  FirebaseSubject, 
  createSubject,
  createQuiz,
  getUserClasses,
  FirebaseClass,
  FirebaseQuiz
} from '@/lib/firestore';

interface ExtendedSubject extends FirebaseSubject {
  source?: 'personal' | 'class';
  className?: string;
}

export default function AIQuizGenerator() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<ExtendedSubject[]>([]);
  const [classes, setClasses] = useState<FirebaseClass[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<ExtendedSubject[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<FirebaseClass[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  
  // Load saved draft from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedData = localStorage.getItem('ai_quiz_draft');
      if (savedData) {
        const draft = JSON.parse(savedData);
        const isRecent = draft.timestamp && (Date.now() - draft.timestamp) < 7 * 24 * 60 * 60 * 1000; // 7 days
        
        if (isRecent) {
          setQuizTitle(draft.quizTitle || "");
          setQuizQuestions(draft.quizQuestions || "");
          setSelectedSubject(draft.selectedSubject || "");
          setSelectedClass(draft.selectedClass || "");
          if (draft.showQuizForm) {
            setShowQuizForm(true);
          }
        } else {
          localStorage.removeItem('ai_quiz_draft');
        }
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
      localStorage.removeItem('ai_quiz_draft');
    }
  }, []);
  
  // Dynamic filtering logic
  useEffect(() => {
    // Filter subjects based on selected class
    if (selectedClass) {
      setFilteredSubjects(subjects.filter(s => !s.classId || s.classId === selectedClass));
    } else {
      setFilteredSubjects(subjects);
    }
  }, [selectedClass, subjects]);

  useEffect(() => {
    // Filter classes based on selected subject
    if (selectedSubject) {
      const subjectObj = subjects.find(s => s.name === selectedSubject);
      if (subjectObj?.classId) {
        setFilteredClasses(classes.filter(c => c.id === subjectObj.classId));
      } else {
        setFilteredClasses(classes);
      }
    } else {
      setFilteredClasses(classes);
    }
  }, [selectedSubject, classes, subjects]);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizQuestions, setQuizQuestions] = useState("");
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const subjectFormRef = useRef<HTMLDivElement>(null);
  const quizFormRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Don't save if form is completely empty
    const isEmpty = !quizTitle && !quizQuestions && !selectedSubject && !selectedClass && !showQuizForm;
    if (isEmpty) return;
    
    const draft = {
      quizTitle,
      quizQuestions,
      selectedSubject,
      selectedClass,
      showQuizForm,
      timestamp: Date.now()
    };
    
    localStorage.setItem('ai_quiz_draft', JSON.stringify(draft));
  }, [quizTitle, quizQuestions, selectedSubject, selectedClass, showQuizForm]);

  useEffect(() => {
    if (!user?.uid || !user?.email) {
      setLoading(false);
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.uid || !user?.email) return;
    
    try {
      setLoading(true);
      
      // Load all subjects (personal + class subjects)
      const allSubjects = await getAllUserSubjects(user.uid, user.email);
      
      // Load user classes
      const userClasses = await getUserClasses(user.email);
      
      // Mark subjects with their source and class name
      const extendedSubjects: ExtendedSubject[] = allSubjects.map(subject => {
        if (subject.classId) {
          const parentClass = userClasses.find(c => c.id === subject.classId);
          return {
            ...subject,
            source: 'class' as const,
            className: parentClass?.name || 'Unknown Class'
          };
        } else {
          return {
            ...subject,
            source: 'personal' as const
          };
        }
      });
      
      setSubjects(extendedSubjects);
      setClasses(userClasses);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSubject = async () => {
    if (!newSubject.trim() || !user?.uid) {
      alert("Please enter a subject name");
      return;
    }

    // Check if subject already exists
    const subjectExists = subjects.some(subject => 
      subject.name.toLowerCase() === newSubject.toLowerCase()
    );
    if (subjectExists) {
      alert("A subject with this name already exists!");
      return;
    }

    try {
      setCreating(true);
      const subjectId = await createSubject(newSubject.trim(), user.uid);
      
      // Reload subjects to show the new one
      await loadData();
      
      setNewSubject("");
      setShowSubjectForm(false);
      alert("Subject created successfully!");
    } catch (error) {
      console.error('Error creating subject:', error);
      alert("Failed to create subject. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const createQuizFromAI = async () => {
    if (!quizTitle.trim() || !selectedSubject || !quizQuestions.trim() || !user?.uid) {
      alert("Please fill in all fields");
      return;
    }

    try {
      setCreating(true);
      
      // Find the selected subject
      const selectedSubjectObj = subjects.find(s => s.name === selectedSubject);
      
      const quizData: Omit<FirebaseQuiz, 'id' | 'createdAt' | 'updatedAt'> = {
        title: quizTitle.trim(),
        subject: selectedSubject,
        questions: parseQuizQuestions(quizQuestions),
        userId: user.uid,
        isPersonal: !selectedClass || selectedClass === ""
      };
      
      // Only add optional fields if they have values
      if (selectedClass) {
        quizData.classId = selectedClass;
      }
      if (selectedSubjectObj?.id) {
        quizData.subjectId = selectedSubjectObj.id;
      }

      await createQuiz(quizData);

      // Clear saved draft
      localStorage.removeItem('ai_quiz_draft');

      // Reset form
      setQuizTitle("");
      setQuizQuestions("");
      setSelectedSubject("");
      setSelectedClass("");
      setShowQuizForm(false);
      
      alert(`Quiz created successfully!${selectedClass ? ' Added to selected class.' : ''}`);
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert("Failed to create quiz. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const parseQuizQuestions = (text: string) => {
    const questions = [];
    const questionBlocks = text.split(/\n\s*\n/).filter(block => block.trim());
    
    for (const block of questionBlocks) {
      const lines = block.split('\n').map(line => line.trim()).filter(line => line);
      if (lines.length < 5) continue; // Need at least question + 4 options
      
      const question = lines[0].replace(/^\d+\.\s*/, ''); // Remove numbering
      const options = [];
      let correctIndex = 0;
      
      for (let i = 1; i < Math.min(5, lines.length); i++) {
        let option = lines[i].replace(/^[A-Da-d][\)\.]\s*/, ''); // Remove A) B) etc.
        
        // Check if this option is marked as correct (with *)
        if (option.includes('*') || lines[i].includes('*')) {
          option = option.replace(/\*/g, '').trim();
          correctIndex = i - 1;
        }
        
        options.push(option);
      }
      
      if (options.length === 4) {
        questions.push({ question, options, correct: correctIndex });
      }
    }
    
    return questions;
  };

  // Show loading or auth redirect
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full filter blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full filter blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-500/10 rounded-full filter blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        </div>
        <div className="relative z-10 text-center px-4 animate-fade-in">
          <div className="mb-8 inline-block">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-400 via-violet-500 to-pink-500 flex items-center justify-center text-white text-5xl font-black animate-bounce-soft shadow-glow">
              Q
            </div>
          </div>
          <h1 className="text-6xl md:text-8xl font-black mb-6">
            <span className="gradient-text">AI Quiz Generator</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-2xl mx-auto">
            Please log in to access AI Quiz Generator
          </p>
          <Link href="/" className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold text-lg hover:scale-105 transition-all duration-300 shadow-glow">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <SideNav />
      <div className="md:ml-64 min-h-screen p-4 md:p-8">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-500/5 rounded-full filter blur-3xl animate-float"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-violet-500/5 rounded-full filter blur-3xl animate-float" style={{animationDelay: '1.5s'}}></div>
        </div>
        <div className="relative z-10 mb-8">
          <div className="glass-card rounded-3xl p-8 md:p-12 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-white/10">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-4xl md:text-6xl font-black mb-3">
                  <span className="text-white">AI Quiz Generator</span>
                </h1>
                <p className="text-slate-300 text-lg">Create quizzes instantly with AI</p>
              </div>
              <Link href="/quizzes" className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:scale-105 transition-all duration-300 shadow-glow">
                My Quizzes
              </Link>
            </div>
          </div>
        </div>
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="glass-card rounded-3xl p-6 md:col-span-2 animate-slide-up">
            <h3 className="text-xl font-bold text-white mb-4">Generate a Quiz</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Quiz Title</label>
                <input
                  type="text"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  className="w-full p-2 border border-green-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  placeholder="Enter quiz title..."
                />
                <label className="block text-sm font-medium text-gray-300 mb-1 mt-4">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full p-2 border border-green-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                >
                  <option value="">Select a subject</option>
                  {filteredSubjects.map((subject) => (
                    <option key={subject.id} value={subject.name}>
                      {subject.source === 'class' ? `${subject.name} (${subject.className})` : subject.name}
                    </option>
                  ))}
                </select>
                <label className="block text-sm font-medium text-gray-300 mb-1 mt-4">Add to Class (Optional)</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full p-2 border border-green-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                >
                  <option value="">No class (Personal quiz)</option>
                  {filteredClasses.map((classData) => (
                    <option key={classData.id} value={classData.id}>
                      {classData.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={createQuizFromAI}
                  disabled={!quizTitle.trim() || !selectedSubject || !quizQuestions.trim() || creating}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2 px-4 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm mt-6"
                >
                  {creating ? "Creating..." : "Create Quiz"}
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Quiz Questions (Paste from AI)</label>
                <textarea
                  value={quizQuestions}
                  onChange={(e) => setQuizQuestions(e.target.value)}
                  className="w-full h-32 p-2 border border-green-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  placeholder="Paste AI-generated questions here..."
                />
              </div>
            </div>
          </div>
          <div className="glass-card rounded-3xl p-6 md:col-span-1 animate-slide-up" style={{animationDelay: '0.1s'}}>
            <h3 className="text-xl font-bold text-white mb-4">Quick Links</h3>
            <div className="space-y-3">
              <Link href="/quizzes" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform">📝</div>
                <span className="font-semibold text-slate-200 group-hover:text-white transition-colors">My Quizzes</span>
              </Link>
              <Link href="/classes" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform">🏫</div>
                <span className="font-semibold text-slate-200 group-hover:text-white transition-colors">My Classes</span>
              </Link>
              <Link href="/subjects" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform">📚</div>
                <span className="font-semibold text-slate-200 group-hover:text-white transition-colors">Subjects</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}