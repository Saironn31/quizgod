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
  
  const [quizTitle, setQuizTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");
  const [customPrompt, setCustomPrompt] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfText, setPdfText] = useState("");
  const [generatedQuestions, setGeneratedQuestions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load saved draft from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedData = localStorage.getItem('ai_quiz_draft');
      if (savedData) {
        const draft = JSON.parse(savedData);
        const isRecent = draft.timestamp && (Date.now() - draft.timestamp) < 7 * 24 * 60 * 60 * 1000;
        
        if (isRecent) {
          setQuizTitle(draft.quizTitle || "");
          setTopic(draft.topic || "");
          setNumQuestions(draft.numQuestions || 5);
          setDifficulty(draft.difficulty || "medium");
          setCustomPrompt(draft.customPrompt || "");
          setSelectedSubject(draft.selectedSubject || "");
          setSelectedClass(draft.selectedClass || "");
          setGeneratedQuestions(draft.generatedQuestions || "");
        } else {
          localStorage.removeItem('ai_quiz_draft');
        }
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
      localStorage.removeItem('ai_quiz_draft');
    }
  }, []);
  
  // Auto-save draft to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const isEmpty = !quizTitle && !topic && !customPrompt && !selectedSubject && !selectedClass && !generatedQuestions;
    if (isEmpty) return;
    
    const draft = {
      quizTitle,
      topic,
      numQuestions,
      difficulty,
      customPrompt,
      selectedSubject,
      selectedClass,
      generatedQuestions,
      timestamp: Date.now()
    };
    
    localStorage.setItem('ai_quiz_draft', JSON.stringify(draft));
  }, [quizTitle, topic, numQuestions, difficulty, customPrompt, selectedSubject, selectedClass, generatedQuestions]);
  
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

  const copyPromptToClipboard = () => {
    const promptText = `Create a quiz with multiple choice questions on the topic: ${selectedSubject || '[Your Topic]'} with ${quizTitle || '[Your Quiz Title]'}.

Format each question exactly like this:
1. Question text here?
A) Option 1
B) Option 2*
C) Option 3
D) Option 4

(Mark the correct answer with an asterisk *)

Please provide 5-10 questions following this exact format.`;

    navigator.clipboard.writeText(promptText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Failed to copy prompt');
    });
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
      <div className="md:ml-64 min-h-screen p-4 md:p-8 pb-32 md:pb-8">
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
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-300">Quiz Questions (Paste from AI)</label>
                  <button
                    onClick={copyPromptToClipboard}
                    className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1"
                  >
                    {copied ? '✓ Copied!' : '📋 Copy Prompt'}
                  </button>
                </div>
                <textarea
                  value={quizQuestions}
                  onChange={(e) => setQuizQuestions(e.target.value)}
                  className="w-full h-32 p-2 border border-green-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  placeholder="Paste AI-generated questions here..."
                />
                <p className="text-xs text-purple-300 mt-2">💡 Click "Copy Prompt" to get an AI prompt template, paste it into ChatGPT or any AI, then paste the generated questions here.</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-3xl p-6 md:col-span-1 animate-slide-up" style={{animationDelay: '0.1s'}}>
            {/* Quick Links removed */}
          </div>
        </div>

        {/* Google Gemini Section */}
        <div className="relative z-10 mb-20">
          <div className="glass-card rounded-3xl p-6 md:p-8 animate-slide-up bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2 border-white/10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl md:text-3xl font-black shadow-glow">
                G
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-white mb-1">Google Gemini</h2>
                <p className="text-slate-300 text-sm md:text-base">Generate quizzes with Google's advanced AI</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🚀</span>
                  <h3 className="text-lg md:text-xl font-bold text-white">Quick & Powerful</h3>
                </div>
                <p className="text-slate-300 text-sm md:text-base mb-4">
                  Gemini creates high-quality quizzes in seconds with multimodal understanding and context awareness.
                </p>
                <ul className="space-y-2 text-sm md:text-base text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 shrink-0">✓</span>
                    <span>Fast generation with deep context</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 shrink-0">✓</span>
                    <span>Multiple difficulty levels</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 shrink-0">✓</span>
                    <span>Free tier available</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">💡</span>
                  <h3 className="text-lg md:text-xl font-bold text-white">How to Use</h3>
                </div>
                <ol className="space-y-3 text-sm md:text-base text-slate-300">
                  <li className="flex gap-3">
                    <span className="font-bold text-blue-400 shrink-0">1.</span>
                    <span>Copy the prompt template above</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-blue-400 shrink-0">2.</span>
                    <span>Visit <a href="https://gemini.google.com" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">gemini.google.com</a></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-blue-400 shrink-0">3.</span>
                    <span>Paste and customize your prompt</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-blue-400 shrink-0">4.</span>
                    <span>Copy the generated questions</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-blue-400 shrink-0">5.</span>
                    <span>Paste into the form above and create!</span>
                  </li>
                </ol>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://gemini.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-glow text-center text-sm md:text-base"
              >
                🌟 Open Google Gemini
              </a>
              <button
                onClick={copyPromptToClipboard}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 shadow-lg text-center text-sm md:text-base"
              >
                {copied ? '✓ Prompt Copied!' : '📋 Copy Prompt Template'}
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
              <p className="text-xs md:text-sm text-blue-200 text-center">
                <span className="font-semibold">💡 Pro Tip:</span> You can also use ChatGPT, Claude, or any other AI assistant with the same prompt!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}