"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import ThemeToggle from "../../components/ThemeToggle";
import { useAuth } from '@/contexts/AuthContext';
import { getUserSubjects, FirebaseSubject, createSubject } from '@/lib/firestore';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface LocalClass {
  id: string;
  name: string;
  members: string[];
  subjects: string[];
}

interface ExtendedSubject {
  id: string;
  name: string;
  source?: 'personal' | 'class';
  className?: string;
}

export default function AIQuizGenerator() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<ExtendedSubject[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [quizTitle, setQuizTitle] = useState("");
  const [quizQuestions, setQuizQuestions] = useState("");
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [showQuizForm, setShowQuizForm] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadSubjects();
  }, [user]);

  const loadSubjects = async () => {
    if (!user) return;
    
    try {
      // Load personal subjects from Firebase
      const userSubjects = await getUserSubjects(user.uid);
      
      // Load class subjects from classes user is a member of
      const allClasses = JSON.parse(localStorage.getItem("qg_all_classes") || "[]");
      const userClasses = allClasses.filter((classInfo: LocalClass) => 
        classInfo.members && user.email && classInfo.members.includes(user.email) && classInfo.subjects
      );
      
      // Extract unique subjects from classes
      const classSubjects: ExtendedSubject[] = [];
      const seenSubjects = new Set(userSubjects.map(s => s.name.toLowerCase()));
      
      userClasses.forEach((classInfo: LocalClass) => {
        classInfo.subjects.forEach((subjectName: string) => {
          if (!seenSubjects.has(subjectName.toLowerCase())) {
            classSubjects.push({
              id: `class-${classInfo.id}-${subjectName}`,
              name: subjectName,
              source: 'class',
              className: classInfo.name
            });
            seenSubjects.add(subjectName.toLowerCase());
          }
        });
      });
      
      // Combine personal and class subjects
      const personalSubjects = userSubjects.map(s => ({ 
        id: s.id, 
        name: s.name, 
        source: 'personal' as const 
      }));
      const allSubjects = [...personalSubjects, ...classSubjects];
      setSubjects(allSubjects);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const addSubject = async () => {
    if (!user || !newSubject.trim() || subjects.some(s => s.name.toLowerCase() === newSubject.toLowerCase())) {
      return;
    }
    
    try {
      await createSubject(newSubject.trim(), user.uid);
      await loadSubjects(); // Reload subjects to get the new one
      setNewSubject("");
      setShowSubjectForm(false);
    } catch (error) {
      console.error('Error creating subject:', error);
    }
  };

  const createQuiz = () => {
    if (!quizTitle.trim() || !selectedSubject || !quizQuestions.trim()) {
      alert("Please fill in all fields");
      return;
    }

    const newQuiz = {
      id: Date.now().toString(),
      title: quizTitle.trim(),
      subject: selectedSubject,
      questions: parseQuizQuestions(quizQuestions),
      creator: user?.email || "Unknown User",
      createdAt: new Date().toISOString(),
      isShared: true
    };

    // Save to localStorage
    const existingQuizzes = JSON.parse(localStorage.getItem("qg_quizzes") || "[]");
    existingQuizzes.push(newQuiz);
    localStorage.setItem("qg_quizzes", JSON.stringify(existingQuizzes));

    // Reset form
    setQuizTitle("");
    setQuizQuestions("");
    setSelectedSubject("");
    setShowQuizForm(false);
    
    alert("Quiz created successfully!");
  };

  const parseQuizQuestions = (text: string) => {
    const questions = [];
    const questionBlocks = text.split(/Question \d+:/);
    
    for (let i = 1; i < questionBlocks.length; i++) {
      const block = questionBlocks[i].trim();
      const lines = block.split('\n').filter(line => line.trim());
      
      if (lines.length >= 5) {
        const questionText = lines[0].trim();
        const options = [];
        let correctAnswer = "";
        let explanation = "";
        
        for (let j = 1; j < lines.length; j++) {
          const line = lines[j].trim();
          if (line.match(/^[A-D]\)/)) {
            options.push(line.substring(2).trim());
          } else if (line.includes("**Correct Answer:")) {
            correctAnswer = line.match(/\*\*Correct Answer:\s*([A-D])\*\*/)?.[1] || "";
          } else if (line.includes("**Explanation:")) {
            explanation = line.replace(/\*\*Explanation:\s*/, "").replace(/\*\*$/, "");
          }
        }
        
        if (questionText && options.length === 4 && correctAnswer) {
          questions.push({
            id: `q_${Date.now()}_${i}`,
            question: questionText,
            type: "multiple-choice",
            options: options,
            correctAnswer: options[correctAnswer.charCodeAt(0) - 65] || options[0],
            explanation: explanation || "No explanation provided"
          });
        }
      }
    }
    
    return questions;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm border-b border-purple-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            🧠 QuizGod
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/create" className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400">
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
            <Link href="/ai-quiz" className="text-purple-600 dark:text-purple-400 font-semibold">
              Smart Quiz
            </Link>
            <ThemeToggle />
            <span className="text-gray-700 dark:text-gray-300">Welcome, {user?.email}!</span>
            <button
              onClick={async () => {
                try {
                  await signOut(auth);
                  window.location.href = "/";
                } catch (error) {
                  console.error('Logout error:', error);
                }
              }}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content with AI Quiz Generator */}
      <div className="p-4">
        <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-gray-700">
          <div className="p-4 border-b border-purple-100 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-1">🧠 AI Quiz Generator</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Create intelligent quizzes with advanced AI assistance from DeepSeek
            </p>
          </div>
          
          <div className="p-4 space-y-4">
            {/* DeepSeek AI Button */}
            <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-lg border border-purple-200 dark:border-purple-700">
              <div className="flex items-center justify-center space-x-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-800 rounded-full">
                  <span className="text-xl">🤖</span>
                </div>
                <div className="text-left">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">DeepSeek AI Assistant</h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Get help creating quiz questions and analyzing content</p>
                </div>
                <button
                  onClick={() => window.open('https://chat.deepseek.com', '_blank')}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <span className="mr-2">🚀</span>
                  Open DeepSeek AI
                  <span className="ml-2">↗</span>
                </button>
              </div>
            </div>

            {/* PDF-Based Quiz Prompt Template */}
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-900/30 dark:to-blue-900/30 rounded-lg border border-emerald-200 dark:border-emerald-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">📄 PDF Quiz Generator Prompt</h3>
                <button
                  onClick={() => {
                    const promptText = `I will provide you with text content from a PDF document that may include both regular text and text extracted from images using OCR. Please analyze this content and create a quiz with the following specifications:

**REQUIREMENTS:**
- Generate 10 multiple choice questions
- Each question should have exactly 4 answer options (A, B, C, D)
- Clearly mark the correct answer
- Base questions on the most important concepts from the provided content
- Include a mix of factual recall, comprehension, and application questions

**FORMAT:**
Please format your response exactly like this:

Question 1: [Your question here]
A) [Option A]
B) [Option B]  
C) [Option C]
D) [Option D]
**Correct Answer: [Letter]**
**Explanation: [Brief explanation why this is correct]**

Question 2: [Your question here]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
**Correct Answer: [Letter]**
**Explanation: [Brief explanation why this is correct]**

[Continue for all 10 questions...]

**CONTENT TO ANALYZE:**
[Paste your PDF text content here - including both regular text and any text extracted from images/diagrams in the PDF]

Please ensure the questions test understanding of key concepts rather than obscure details, and make sure all answer options are plausible but only one is clearly correct.`;
                    
                    navigator.clipboard.writeText(promptText).then(() => {
                      alert('Prompt copied to clipboard! Paste it in DeepSeek AI chat.');
                    }).catch(() => {
                      alert('Please manually copy the prompt from the text area.');
                    });
                  }}
                  className="px-3 py-1 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors duration-200 text-sm font-medium"
                >
                  📋 Copy Prompt
                </button>
              </div>
              
              <div className="bg-white/70 dark:bg-gray-800/70 p-3 rounded-lg border border-emerald-200 dark:border-emerald-600 max-h-48 overflow-y-auto">
                <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
{`I will provide you with text content from a PDF document that may include both regular text and text extracted from images using OCR. Please analyze this content and create a quiz with the following specifications:

**REQUIREMENTS:**
- Generate 10 multiple choice questions
- Each question should have exactly 4 answer options (A, B, C, D)
- Clearly mark the correct answer
- Base questions on the most important concepts from the provided content
- Include a mix of factual recall, comprehension, and application questions

**FORMAT:**
Please format your response exactly like this:

Question 1: [Your question here]
A) [Option A]
B) [Option B]  
C) [Option C]
D) [Option D]
**Correct Answer: [Letter]**
**Explanation: [Brief explanation why this is correct]**

Question 2: [Your question here]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
**Correct Answer: [Letter]**
**Explanation: [Brief explanation why this is correct]**

[Continue for all 10 questions...]

**CONTENT TO ANALYZE:**
[Paste your PDF text content here - including both regular text and any text extracted from images/diagrams in the PDF]

Please ensure the questions test understanding of key concepts rather than obscure details, and make sure all answer options are plausible but only one is clearly correct.`}
                </pre>
              </div>
              
              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-600">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1 text-sm">📌 How to Use:</h4>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  1. Copy prompt → 2. Open DeepSeek AI → 3. Paste prompt → 4. Add your PDF text → 5. Get formatted quiz questions!
                </p>
              </div>
            </div>

            {/* Subject and Quiz Creation Section */}
            <div className="grid lg:grid-cols-3 gap-4">
              {/* Create Subject */}
              <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 rounded-lg border border-orange-200 dark:border-orange-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">📚 Create Subject</h3>
                  <button
                    onClick={() => setShowSubjectForm(!showSubjectForm)}
                    className="px-3 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 text-sm font-medium"
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
                      className="w-full p-2 border border-orange-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                      placeholder="Enter subject name..."
                      onKeyPress={(e) => e.key === "Enter" && addSubject()}
                    />
                    <button
                      onClick={addSubject}
                      disabled={!newSubject.trim()}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 px-4 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                    >
                      Create Subject
                    </button>
                  </div>
                )}
                
                <div className="mt-3">
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2 text-sm">Subjects ({subjects.length})</h4>
                  <div className="max-h-24 overflow-y-auto space-y-1">
                    {subjects.map((subject) => (
                      <div key={subject.id} className="p-2 bg-white/60 dark:bg-gray-700/60 rounded border text-xs">
                        {subject.source === 'class' ? `"${subject.name}" ("${subject.className}")` : subject.name}
                      </div>
                    ))}
                    {subjects.length === 0 && (
                      <p className="text-gray-500 dark:text-gray-400 text-xs">No subjects created yet</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Create Quiz */}
              <div className="lg:col-span-2 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg border border-green-200 dark:border-green-700">
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
                          {subjects.map((subject) => (
                            <option key={subject.id} value={subject.name}>
                              {subject.source === 'class' ? `"${subject.name}" ("${subject.className}")` : subject.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <button
                        onClick={createQuiz}
                        disabled={!quizTitle.trim() || !selectedSubject || !quizQuestions.trim()}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2 px-4 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                      >
                        Create Quiz
                      </button>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Quiz Questions (Paste from AI)
                      </label>
                      <textarea
                        value={quizQuestions}
                        onChange={(e) => setQuizQuestions(e.target.value)}
                        className="w-full h-32 p-2 border border-green-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-xs"
                        placeholder="Paste the formatted questions from DeepSeek AI here..."
                      />
                    </div>
                  </div>
                )}
                
                <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-600">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    💡 <strong>Tip:</strong> Use the AI prompt above to generate questions, then paste them here to create your quiz!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}