"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import SideNav from '@/components/SideNav';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getUserSubjects, 
  getAllUserSubjects,
  FirebaseSubject,
  createQuiz,
  getUserClasses,
  FirebaseClass,
  FirebaseQuiz,
  createSubject
} from '@/lib/firestore';

type Question = { question: string; options: string[]; correct: number };

interface ExtendedFirebaseSubject extends FirebaseSubject {
  source?: 'personal' | 'class';
  className?: string;
}

export default function CreatePage() {
  const { user } = useAuth();
  
  // Mode selection
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  
  // Common fields
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [subjects, setSubjects] = useState<ExtendedFirebaseSubject[]>([]);
  const [classes, setClasses] = useState<FirebaseClass[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<ExtendedFirebaseSubject[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<FirebaseClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Manual mode fields
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([{ question: "", options: ["", "", "", ""], correct: 0 }]);
  
  // AI mode fields
  const [numQuestions, setNumQuestions] = useState(5);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfText, setPdfText] = useState("");
  const [generatedQuestions, setGeneratedQuestions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved draft
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedData = localStorage.getItem('create_quiz_draft_v3');
      if (savedData) {
        const draft = JSON.parse(savedData);
        const isRecent = draft.timestamp && (Date.now() - draft.timestamp) < 7 * 24 * 60 * 60 * 1000;
        
        if (isRecent) {
          setMode(draft.mode || 'manual');
          setTitle(draft.title || "");
          setSubject(draft.subject || "");
          setSelectedClass(draft.selectedClass || "");
          setDescription(draft.description || "");
          setQuestions(draft.questions || [{ question: "", options: ["", "", "", ""], correct: 0 }]);
          setNumQuestions(draft.numQuestions || 5);
          setGeneratedQuestions(draft.generatedQuestions || "");
          setPdfText(draft.pdfText || "");
        } else {
          localStorage.removeItem('create_quiz_draft_v3');
        }
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
      localStorage.removeItem('create_quiz_draft_v3');
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const isEmpty = !title && !subject && !selectedClass && !description && 
                    !generatedQuestions &&
                    questions.length === 1 && !questions[0].question && 
                    questions[0].options.every(opt => !opt);
    
    if (isEmpty) return;
    
    const draft = {
      mode,
      title,
      subject,
      selectedClass,
      description,
      questions,
      numQuestions,
      generatedQuestions,
      pdfText,
      timestamp: Date.now()
    };
    
    localStorage.setItem('create_quiz_draft_v3', JSON.stringify(draft));
  }, [mode, title, subject, selectedClass, description, questions, numQuestions, generatedQuestions, pdfText]);

  // Dynamic filtering
  useEffect(() => {
    if (selectedClass) {
      setFilteredSubjects(subjects.filter(s => !s.classId || s.classId === selectedClass));
    } else {
      setFilteredSubjects(subjects);
    }
  }, [selectedClass, subjects]);

  useEffect(() => {
    if (subject) {
      const subjectObj = subjects.find(s => s.name === subject);
      if (subjectObj?.classId) {
        setFilteredClasses(classes.filter(c => c.id === subjectObj.classId));
      } else {
        setFilteredClasses(classes);
      }
    } else {
      setFilteredClasses(classes);
    }
  }, [subject, classes, subjects]);

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
      const allSubjects = await getAllUserSubjects(user.uid, user.email);
      const userClasses = await getUserClasses(user.email);
      
      const extendedSubjects: ExtendedFirebaseSubject[] = allSubjects.map(subj => {
        if (subj.classId) {
          const parentClass = userClasses.find(c => c.id === subj.classId);
          return {
            ...subj,
            source: 'class' as const,
            className: parentClass?.name || 'Unknown Class'
          };
        } else {
          return {
            ...subj,
            source: 'personal' as const
          };
        }
      });
      
      setSubjects(extendedSubjects);
      setFilteredSubjects(extendedSubjects);
      setClasses(userClasses);
      setFilteredClasses(userClasses);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectChange = (value: string) => {
    setSubject(value);
    const subjectObj = subjects.find(s => s.name === value);
    if (subjectObj?.classId) {
      setSelectedClass(subjectObj.classId);
    }
  };

  const handleClassChange = (value: string) => {
    setSelectedClass(value);
    if (value && subject) {
      const subjectObj = subjects.find(s => s.name === subject);
      if (subjectObj?.classId && subjectObj.classId !== value) {
        setSubject("");
      }
    }
  };

  // Manual mode functions
  const addQuestion = () => {
    setQuestions([...questions, { question: "", options: ["", "", "", ""], correct: 0 }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setQuestions(newQuestions);
  };

  // AI mode functions
  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    setPdfFile(file);
    setIsExtracting(true);
    setError("");

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
      }

      setPdfText(fullText);
    } catch (error) {
      console.error('Error extracting PDF:', error);
      setError('Failed to extract text from PDF. Please try again.');
    } finally {
      setIsExtracting(false);
    }
  };

  const generateWithGemini = async () => {
    if (!title.trim() || !subject) {
      alert("Please fill in quiz title and select a subject");
      return;
    }

    if (!pdfText) {
      alert("Please upload a PDF file");
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      alert("Please configure your Gemini API key in .env.local file.\n\nGet your free API key from: https://makersuite.google.com/app/apikey");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      console.log('Starting Gemini API request...');
      console.log('API Key exists:', !!apiKey);
      console.log('PDF Text length:', pdfText?.length || 0);
      
      const basePrompt = `Create ${numQuestions} multiple choice quiz questions about ${subject}.

Based on this content:
${pdfText.slice(0, 10000)}

Format each question EXACTLY like this:
1. Question text here?
A) Option 1
B) Option 2*
C) Option 3
D) Option 4

Mark the correct answer with an asterisk (*).
Provide exactly ${numQuestions} questions.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: basePrompt
              }]
            }]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || response.statusText || 'Unknown error';
        throw new Error(`API request failed (${response.status}): ${errorMessage}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error('No content generated from AI. Please try again.');
      }

      setGeneratedQuestions(generatedText);
    } catch (error) {
      console.error('Error generating with Gemini:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to generate questions. Please try again.';
      setError(errorMsg);
      alert('Error: ' + errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const parseQuizQuestions = (text: string) => {
    const questions: Question[] = [];
    const questionBlocks = text.split(/\d+\.\s+/).filter(block => block.trim());

    for (const block of questionBlocks) {
      const lines = block.trim().split('\n').filter(line => line.trim());
      if (lines.length < 5) continue;

      const questionText = lines[0].replace(/\?$/, '').trim();
      const options = [];
      let correctIndex = 0;

      for (let i = 1; i < lines.length && options.length < 4; i++) {
        const line = lines[i].trim();
        const match = line.match(/^[A-D][\)\.]?\s*(.+?)(\*)?$/i);
        if (match) {
          options.push(match[1].trim().replace(/\*$/, ''));
          if (match[2] || line.includes('*')) {
            correctIndex = options.length - 1;
          }
        }
      }

      if (questionText && options.length === 4) {
        questions.push({
          question: questionText,
          options,
          correct: correctIndex
        });
      }
    }

    return questions;
  };

  // Submit handlers
  const handleManualSubmit = async () => {
    if (!user?.uid) {
      alert("Please log in to create a quiz");
      return;
    }

    if (!title.trim()) {
      alert("Please enter a quiz title");
      return;
    }

    if (!subject) {
      alert("Please select a subject");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        alert(`Please enter question ${i + 1}`);
        return;
      }
      if (q.options.some(option => !option.trim())) {
        alert(`Please fill all options for question ${i + 1}`);
        return;
      }
    }

    try {
      setSaving(true);
      
      const selectedSubject = subjects.find(s => s.name === subject);
      
      const quizData: any = {
        title: title.trim(),
        subject: subject,
        questions: questions,
        userId: user.uid,
        isPersonal: !selectedClass || selectedClass === ""
      };
      
      if (description.trim()) {
        quizData.description = description.trim();
      }
      if (selectedSubject?.id) {
        quizData.subjectId = selectedSubject.id;
      }
      if (selectedClass) {
        quizData.classId = selectedClass;
      }
      
      await createQuiz(quizData);

      alert("Quiz created successfully!");
      
      localStorage.removeItem('create_quiz_draft_v3');
      
      setTitle("");
      setSubject("");
      setSelectedClass("");
      setDescription("");
      setQuestions([{ question: "", options: ["", "", "", ""], correct: 0 }]);
      
      window.location.href = "/quizzes";
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert("Failed to create quiz. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAISubmit = async () => {
    if (!title.trim() || !subject || !generatedQuestions.trim() || !user?.uid) {
      alert("Please fill in all required fields and generate questions first");
      return;
    }

    try {
      setSaving(true);
      
      const selectedSubjectObj = subjects.find(s => s.name === subject);
      
      const parsedQuestions = parseQuizQuestions(generatedQuestions);

      if (parsedQuestions.length === 0) {
        alert("No valid questions found. Please check the format.");
        return;
      }
      
      const quizData: Omit<FirebaseQuiz, 'id' | 'createdAt' | 'updatedAt'> = {
        title: title.trim(),
        subject: subject,
        questions: parsedQuestions,
        userId: user.uid,
        isPersonal: !selectedClass || selectedClass === ""
      };
      
      if (selectedClass) {
        quizData.classId = selectedClass;
      }
      if (selectedSubjectObj?.id) {
        quizData.subjectId = selectedSubjectObj.id;
      }

      await createQuiz(quizData);

      localStorage.removeItem('create_quiz_draft_v3');

      setTitle("");
      setSubject("");
      setGeneratedQuestions("");
      setPdfText("");
      setPdfFile(null);
      setSelectedClass("");

      alert(`Quiz created successfully with ${parsedQuestions.length} questions!`);
      window.location.href = "/quizzes";
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert("Failed to create quiz. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleClearDraft = () => {
    if (confirm('Are you sure you want to clear this draft? This cannot be undone.')) {
      localStorage.removeItem('create_quiz_draft_v3');
      setTitle("");
      setSubject("");
      setSelectedClass("");
      setDescription("");
      setQuestions([{ question: "", options: ["", "", "", ""], correct: 0 }]);
      setNumQuestions(5);
      setGeneratedQuestions("");
      setPdfText("");
      setPdfFile(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full filter blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full filter blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        </div>
        <div className="relative z-10 text-center px-4 animate-fade-in">
          <h1 className="text-6xl md:text-8xl font-black mb-6">
            <span className="gradient-text">Create Quiz</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-2xl mx-auto">
            Please log in to create a quiz
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

        {/* Header */}
        <div className="relative z-10 mb-6 md:mb-8">
          <div className="glass-card rounded-3xl p-4 md:p-8 lg:p-12 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-white/10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-6xl font-black mb-2 md:mb-3">
                  <span className="text-white">Create Quiz</span>
                </h1>
                <p className="text-slate-300 text-sm md:text-base lg:text-lg">Build manually or generate with AI</p>
              </div>
              <Link href="/quizzes" className="px-4 md:px-6 py-2 md:py-3 text-sm md:text-base rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:scale-105 transition-all duration-300 shadow-glow w-full sm:w-auto text-center">
                My Quizzes
              </Link>
            </div>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="relative z-10 mb-6">
          <div className="glass-card rounded-2xl p-2 inline-flex gap-2">
            <button
              onClick={() => setMode('manual')}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                mode === 'manual'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              ✍️ Manual
            </button>
            <button
              onClick={() => setMode('ai')}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                mode === 'ai'
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              🤖 AI Generator
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-20">
          <div className="glass-card rounded-3xl p-4 md:p-6 lg:col-span-2 animate-slide-up">
            <h3 className="text-lg md:text-xl font-bold text-white mb-4">
              {mode === 'manual' ? 'Quiz Builder' : 'AI Quiz Generator'}
            </h3>

            {/* Draft indicator */}
            {(title || subject || description || generatedQuestions || questions.some(q => q.question || q.options.some(o => o))) && (
              <div className="mb-4 md:mb-6 p-2 md:p-3 bg-blue-500/20 border border-blue-400/30 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-blue-300">💾</span>
                  <span className="text-xs md:text-sm text-blue-200">Draft auto-saved</span>
                </div>
                <button
                  onClick={handleClearDraft}
                  className="text-xs px-3 py-1 bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 transition-colors w-full sm:w-auto"
                >
                  Clear Draft
                </button>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">
                <p className="text-purple-200">Loading...</p>
              </div>
            ) : (
              <>
                {/* Common Fields */}
                <div className="space-y-4 md:space-y-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-300 mb-2">Quiz Title *</label>
                      <input 
                        className="w-full p-2 md:p-3 text-sm md:text-base border border-purple-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" 
                        placeholder="Enter quiz title..." 
                        value={title} 
                        onChange={e => setTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-300 mb-2">Subject *</label>
                      <select 
                        className="w-full p-2 md:p-3 text-sm md:text-base border border-purple-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" 
                        value={subject} 
                        onChange={e => handleSubjectChange(e.target.value)}
                      >
                        <option value="">Select subject</option>
                        {filteredSubjects.map(s => (
                          <option key={s.id} value={s.name}>
                            {s.source === 'class' ? `${s.name} (${s.className})` : s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-300 mb-2">Add to Class (Optional)</label>
                    <select 
                      className="w-full p-2 md:p-3 text-sm md:text-base border border-purple-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" 
                      value={selectedClass} 
                      onChange={e => handleClassChange(e.target.value)}
                    >
                      <option value="">Personal quiz (no class)</option>
                      {filteredClasses.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Manual Mode */}
                {mode === 'manual' && (
                  <div className="space-y-4 md:space-y-6">
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
                      <textarea 
                        className="w-full p-2 md:p-3 text-sm md:text-base border border-purple-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" 
                        rows={3} 
                        placeholder="Brief description of your quiz..." 
                        value={description} 
                        onChange={e => setDescription(e.target.value)}
                      />
                    </div>

                    {/* Questions */}
                    <div className="space-y-4 md:space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <h2 className="text-lg md:text-xl font-semibold text-white">Questions ({questions.length})</h2>
                        <button 
                          onClick={addQuestion}
                          className="px-4 py-2 text-sm md:text-base bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:scale-105 font-medium w-full sm:w-auto"
                        >
                          ➕ Add Question
                        </button>
                      </div>

                      {questions.map((q, i) => (
                        <div key={i} className="bg-white/5 backdrop-blur-sm rounded-lg p-4 md:p-6 border border-white/20">
                          <div className="flex justify-between items-center mb-3 md:mb-4">
                            <h3 className="text-base md:text-lg font-medium text-white">Question {i + 1}</h3>
                            {questions.length > 1 && (
                              <button 
                                onClick={() => removeQuestion(i)}
                                className="px-2 md:px-3 py-1 text-xs md:text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                              >
                                🗑️ Remove
                              </button>
                            )}
                          </div>
                          
                          <div className="space-y-3 md:space-y-4">
                            <input 
                              className="w-full p-2 md:p-3 text-sm md:text-base border border-white/30 bg-white/10 text-white placeholder-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400" 
                              placeholder="Enter your question..." 
                              value={q.question} 
                              onChange={e => updateQuestion(i, { question: e.target.value })}
                            />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                              {q.options.map((option, oi) => (
                                <div key={oi} className="flex items-center gap-2 md:gap-3">
                                  <input 
                                    type="radio" 
                                    name={`correct-${i}`} 
                                    checked={q.correct === oi} 
                                    onChange={() => updateQuestion(i, { correct: oi })}
                                    className="text-purple-500 focus:ring-purple-400 shrink-0"
                                  />
                                  <input 
                                    className="flex-1 min-w-0 p-2 text-sm md:text-base border border-white/30 bg-white/10 text-white placeholder-purple-200 rounded focus:outline-none focus:ring-2 focus:ring-purple-400" 
                                    placeholder={`Option ${oi + 1}`} 
                                    value={option} 
                                    onChange={e => { 
                                      const opts = [...q.options]; 
                                      opts[oi] = e.target.value; 
                                      updateQuestion(i, { options: opts }); 
                                    }} 
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-center pt-4 md:pt-6">
                      <button 
                        onClick={handleManualSubmit}
                        disabled={saving}
                        className="w-full sm:w-auto px-6 md:px-8 py-2.5 md:py-3 text-sm md:text-base bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? "Creating Quiz..." : "🚀 Create Quiz"}
                      </button>
                    </div>
                  </div>
                )}

                {/* AI Mode */}
                {mode === 'ai' && (
                  <div className="space-y-4 md:space-y-6">
                    {/* PDF Upload */}
                    <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-400/30 rounded-xl p-4 md:p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">📄</span>
                        <div>
                          <h4 className="text-base md:text-lg font-bold text-white">Upload PDF</h4>
                          <p className="text-xs md:text-sm text-slate-300">Generate questions from your study material</p>
                        </div>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handlePDFUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isExtracting}
                        className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all font-medium disabled:opacity-50 text-sm md:text-base"
                      >
                        {isExtracting ? "📖 Extracting text..." : pdfFile ? `✓ ${pdfFile.name}` : "📤 Upload PDF File"}
                      </button>
                      {pdfText && (
                        <div className="mt-3 p-3 bg-white/5 rounded-lg">
                          <p className="text-xs text-slate-300">
                            ✓ Extracted {pdfText.length} characters from PDF
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Number of Questions */}
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-300 mb-2">Number of Questions</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={numQuestions}
                        onChange={(e) => setNumQuestions(parseInt(e.target.value) || 5)}
                        className="w-full p-2 md:p-3 text-sm md:text-base border border-purple-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Generate Button */}
                    <button
                      onClick={generateWithGemini}
                      disabled={isGenerating || !pdfText}
                      className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                    >
                      {isGenerating ? "🤖 Generating..." : "✨ Generate Questions"}
                    </button>

                    {error && (
                      <div className="p-4 bg-red-500/20 border border-red-400/30 rounded-lg">
                        <p className="text-red-300 text-sm">{error}</p>
                      </div>
                    )}

                    {/* Generated Questions Preview */}
                    {generatedQuestions && (
                      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 md:p-6 border border-white/20">
                        <h4 className="text-base md:text-lg font-bold text-white mb-3">Generated Questions</h4>
                        <div className="bg-black/30 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
                          <pre className="text-xs md:text-sm text-slate-200 whitespace-pre-wrap">{generatedQuestions}</pre>
                        </div>
                        <button
                          onClick={handleAISubmit}
                          disabled={saving}
                          className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                        >
                          {saving ? "Creating Quiz..." : "🚀 Create Quiz from AI"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
