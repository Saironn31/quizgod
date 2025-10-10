"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import NavBar from '@/components/NavBar';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getUserSubjects, 
  getAllUserSubjects,
  FirebaseSubject, 
  createSubject,
  createQuiz,
  getUserClasses,
  FirebaseClass
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
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

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
      
      const quizData: any = {
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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex justify-center items-center min-h-[50vh]">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Please log in to access AI Quiz Generator</h1>
              <Link href="/" className="text-blue-400 hover:underline">
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex justify-between items-center mb-8 sm:mb-12">
          <div className="text-xl sm:text-2xl font-bold text-white">🧠 QuizGod</div>
          <NavBar />
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">🧠 AI Quiz Generator</h1>
            <p className="text-purple-200">Use AI to help create quizzes and analyze content</p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-purple-200">Loading...</p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              
              {/* AI Prompts Section */}
              <div className="lg:col-span-2 space-y-4">
                {/* PDF Quiz Generator */}
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">📄 PDF Quiz Generator Prompt</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Copy this prompt and paste it to Claude/ChatGPT along with your PDF content</p>
                  <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border text-sm text-gray-700 dark:text-gray-300 font-mono leading-relaxed">
                    Create a quiz based on the following content. Generate 5-10 multiple choice questions with 4 options each. Mark the correct answer with an asterisk (*). Format like this:<br/><br/>
                    1. What is the main topic?<br/>
                    A) Option 1<br/>
                    B) Option 2 *<br/>
                    C) Option 3<br/>
                    D) Option 4<br/><br/>
                    [Insert your PDF text here]
                  </div>
                </div>

                {/* Recommended AI Links */}
                <div className="p-4 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/30 dark:to-slate-800/30 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">🤖 Recommended AI</h3>
                  <div className="space-y-2">
                    <a href="https://chat.deepseek.com" target="_blank" rel="noopener noreferrer" className="block w-full p-2 bg-blue-500 text-white text-center rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
                      DeepSeek
                    </a>
                    <a href="https://gemini.google.com" target="_blank" rel="noopener noreferrer" className="block w-full p-2 bg-yellow-500 text-white text-center rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium">
                      Gemini
                    </a>
                    <a href="https://chat.openai.com" target="_blank" rel="noopener noreferrer" className="block w-full p-2 bg-gray-800 text-white text-center rounded-lg hover:bg-gray-900 transition-colors text-sm font-medium">
                      ChatGPT
                    </a>
                  </div>
                </div>
              </div>

              {/* Management Section */}
              <div className="space-y-4">
                
                {/* Add Subject */}
                <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/30 rounded-lg border border-cyan-200 dark:border-cyan-700">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">📝 Add Subject</h3>
                    <button
                      onClick={() => setShowSubjectForm(!showSubjectForm)}
                      className="px-3 py-1 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors duration-200 text-sm font-medium"
                    >
                      {showSubjectForm ? "Cancel" : "➕ New"}
                    </button>
                  </div>
                  
                  {showSubjectForm && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        className="w-full p-2 border border-cyan-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                        placeholder="Enter subject name..."
                        onKeyPress={(e) => e.key === 'Enter' && addSubject()}
                      />
                      <button
                        onClick={addSubject}
                        disabled={creating}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-2 px-4 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 transition-all duration-200 text-sm"
                      >
                        {creating ? "Adding..." : "Add Subject"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Create Quiz */}
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg border border-green-200 dark:border-green-700">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">📝 Create Quiz</h3>
                    <button
                      onClick={() => setShowQuizForm(!showQuizForm)}
                      className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 text-sm font-medium"
                    >
                      {showQuizForm ? "Cancel" : "➕ New Quiz"}
                    </button>
                  </div>
                  
                  {showQuizForm && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Quiz Title
                          </label>
                          <input
                            type="text"
                            value={quizTitle}
                            onChange={(e) => setQuizTitle(e.target.value)}
                            className="w-full p-2 border border-green-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                            placeholder="Enter quiz title..."
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Subject
                          </label>
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
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Add to Class (Optional)
                          </label>
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
                        </div>
                        
                        <button
                          onClick={createQuizFromAI}
                          disabled={!quizTitle.trim() || !selectedSubject || !quizQuestions.trim() || creating}
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2 px-4 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                        >
                          {creating ? "Creating..." : "Create Quiz"}
                        </button>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Quiz Questions (Paste from AI)
                        </label>
                        <textarea
                          value={quizQuestions}
                          onChange={(e) => setQuizQuestions(e.target.value)}
                          className="w-full h-32 p-2 border border-green-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                          placeholder="Paste AI-generated questions here..."
                        />
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}