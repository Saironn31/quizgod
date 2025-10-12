"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import SideNav from '@/components/SideNav';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getUserSubjects, 
  getAllUserSubjects,
  FirebaseSubject,
  createQuiz,
  getUserClasses,
  FirebaseClass
} from '@/lib/firestore';

type Question = { question: string; options: string[]; correct: number };

interface ExtendedFirebaseSubject extends FirebaseSubject {
  source?: 'personal' | 'class';
  className?: string;
}

export default function CreatePage() {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [questions, setQuestions] = useState<Question[]>([{ question: "", options: ["", "", "", ""], correct: 0 }]);
  const [subjects, setSubjects] = useState<ExtendedFirebaseSubject[]>([]);
  const [classes, setClasses] = useState<FirebaseClass[]>([]);
  const [allSubjects, setAllSubjects] = useState<ExtendedFirebaseSubject[]>([]);
  const [allClasses, setAllClasses] = useState<FirebaseClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  // Load saved form data from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedData = localStorage.getItem('create_quiz_draft');
      if (savedData) {
        const draft = JSON.parse(savedData);
        const isRecent = draft.timestamp && (Date.now() - draft.timestamp) < 7 * 24 * 60 * 60 * 1000; // 7 days
        
        if (isRecent) {
          setTitle(draft.title || "");
          setSubject(draft.subject || "");
          setDescription(draft.description || "");
          setSelectedClass(draft.selectedClass || "");
          setQuestions(draft.questions || [{ question: "", options: ["", "", "", ""], correct: 0 }]);
        } else {
          localStorage.removeItem('create_quiz_draft');
        }
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
      localStorage.removeItem('create_quiz_draft');
    }
  }, []);

  // Auto-save form data to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Don't save if form is completely empty
    const isEmpty = !title && !subject && !description && !selectedClass && 
                    questions.length === 1 && !questions[0].question && 
                    questions[0].options.every(opt => !opt);
    
    if (isEmpty) return;
    
    const draft = {
      title,
      subject,
      description,
      selectedClass,
      questions,
      timestamp: Date.now()
    };
    
    localStorage.setItem('create_quiz_draft', JSON.stringify(draft));
  }, [title, subject, description, selectedClass, questions]);

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
      const extendedSubjects: ExtendedFirebaseSubject[] = allSubjects.map(subject => {
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
      
      setAllSubjects(extendedSubjects);
      setAllClasses(userClasses);
      setSubjects(extendedSubjects);
      setClasses(userClasses);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter functions for dynamic dropdown updates
  const handleSubjectChange = (selectedSubject: string) => {
    setSubject(selectedSubject);
    
    if (selectedSubject) {
      const subjectObj = allSubjects.find(s => s.name === selectedSubject);
      
      if (subjectObj?.classId) {
        // Subject belongs to a class - filter classes to only show that class and personal option
        const relevantClass = allClasses.find(c => c.id === subjectObj.classId);
        setClasses(relevantClass ? [relevantClass] : []);
        setSelectedClass(subjectObj.classId);
      } else {
        // Personal subject - filter classes to remove options that don't have this subject
        const classesWithSubject = allClasses.filter(c => 
          allSubjects.some(s => s.classId === c.id && s.name === selectedSubject)
        );
        setClasses(classesWithSubject);
        if (selectedClass && !classesWithSubject.some(c => c.id === selectedClass)) {
          setSelectedClass("");
        }
      }
    } else {
      // No subject selected - show all classes
      setClasses(allClasses);
    }
  };

  const handleClassChange = (selectedClassId: string) => {
    setSelectedClass(selectedClassId);
    
    if (selectedClassId) {
      // Class selected - filter subjects to only show subjects from that class and personal subjects
      const classSubjects = allSubjects.filter(s => 
        s.classId === selectedClassId || s.source === 'personal'
      );
      setSubjects(classSubjects);
      
      // If current subject is not in the filtered list, clear it
      if (subject && !classSubjects.some(s => s.name === subject)) {
        setSubject("");
      }
    } else {
      // No class selected (personal quiz) - show all subjects
      setSubjects(allSubjects);
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, { question: "", options: ["", "", "", ""], correct: 0 }]);
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
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

    // Validate all questions
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
      
      // Find the selected subject
      const selectedSubject = subjects.find(s => s.name === subject);
      
      const quizData: any = {
        title: title.trim(),
        subject: subject,
        questions: questions,
        userId: user.uid,
        isPersonal: !selectedClass || selectedClass === ""
      };
      
      // Only add optional fields if they have values
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
      
      // Clear saved draft from localStorage
      localStorage.removeItem('create_quiz_draft');
      
      // Reset form
      setTitle("");
      setSubject("");
      setSelectedClass("");
      setDescription("");
      setQuestions([{ question: "", options: ["", "", "", ""], correct: 0 }]);
      
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert("Failed to create quiz. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleClearDraft = () => {
    if (confirm('Are you sure you want to clear this draft? This cannot be undone.')) {
      localStorage.removeItem('create_quiz_draft');
      setTitle("");
      setSubject("");
      setSelectedClass("");
      setDescription("");
      setQuestions([{ question: "", options: ["", "", "", ""], correct: 0 }]);
    }
  };

  // Replace NavBar and layout with homepage design
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
        <div className="relative z-10 mb-6 md:mb-8">
          <div className="glass-card rounded-3xl p-4 md:p-8 lg:p-12 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-white/10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-6xl font-black mb-2 md:mb-3">
                  <span className="text-white">Create Quiz</span>
                </h1>
                <p className="text-slate-300 text-sm md:text-base lg:text-lg">Build a new quiz for yourself or your class</p>
              </div>
              <Link href="/quizzes" className="px-4 md:px-6 py-2 md:py-3 text-sm md:text-base rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:scale-105 transition-all duration-300 shadow-glow w-full sm:w-auto text-center">
                My Quizzes
              </Link>
            </div>
          </div>
        </div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-20">
          <div className="glass-card rounded-3xl p-4 md:p-6 lg:col-span-2 animate-slide-up">
            <h3 className="text-lg md:text-xl font-bold text-white mb-4">Quiz Builder</h3>

            {/* Draft indicator */}
            {(title || subject || description || questions.some(q => q.question || q.options.some(o => o))) && (
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
              <div className="space-y-4 md:space-y-6">
                {/* Quiz Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quiz Title *</label>
                    <input 
                      className="w-full p-2 md:p-3 text-sm md:text-base border border-purple-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400" 
                      placeholder="Enter quiz title..." 
                      value={title} 
                      onChange={e => setTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject *</label>
                    <select 
                      className="w-full p-2 md:p-3 text-sm md:text-base border border-purple-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400" 
                      value={subject} 
                      onChange={e => handleSubjectChange(e.target.value)}
                    >
                      <option value="">Select subject</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.name}>
                          {s.source === 'class' ? `${s.name} (${s.className})` : s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Add to Class (Optional)</label>
                    <select 
                      className="w-full p-2 md:p-3 text-sm md:text-base border border-purple-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400" 
                      value={selectedClass} 
                      onChange={e => handleClassChange(e.target.value)}
                    >
                      <option value="">Personal quiz (no class)</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description (Optional)</label>
                    <textarea 
                      className="w-full p-2 md:p-3 text-sm md:text-base border border-purple-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400" 
                      rows={3} 
                      placeholder="Brief description of your quiz..." 
                      value={description} 
                      onChange={e => setDescription(e.target.value)}
                    />
                  </div>
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
                    onClick={handleSubmit}
                    disabled={saving}
                    className="w-full sm:w-auto px-6 md:px-8 py-2.5 md:py-3 text-sm md:text-base bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Creating Quiz..." : "🚀 Create Quiz"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}