"use client";
import React, { useState } from "react";
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
  createSubject
} from '@/lib/firestore';

// Types
interface Question { question: string; options: string[]; correct: number; }
interface ExtendedSubject extends FirebaseSubject { source?: 'personal' | 'class'; className?: string; }

export default function QuizCreatorPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');

  // Shared state
  const [subjects, setSubjects] = useState<ExtendedSubject[]>([]);
  const [classes, setClasses] = useState<FirebaseClass[]>([]);
  const [allSubjects, setAllSubjects] = useState<ExtendedSubject[]>([]);
  const [allClasses, setAllClasses] = useState<FirebaseClass[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual mode state
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [questions, setQuestions] = useState<Question[]>([{ question: "", options: ["", "", "", ""], correct: 0 }]);
  const [saving, setSaving] = useState(false);

  // AI mode state
  const [quizTitle, setQuizTitle] = useState("");
  const [quizQuestions, setQuizQuestions] = useState("");
  const [aiSelectedSubject, setAiSelectedSubject] = useState("");
  const [aiSelectedClass, setAiSelectedClass] = useState("");
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    if (!user?.uid || !user?.email) return;
    
    try {
      setLoading(true);
      const allSubjects = await getAllUserSubjects(user.uid, user.email || '');
      const userClasses = await getUserClasses(user.email || '');
      const extendedSubjects: ExtendedSubject[] = allSubjects.map(subject => {
        if (subject.classId) {
          const parentClass = userClasses.find(c => c.id === subject.classId);
          return { ...subject, source: 'class', className: parentClass?.name || 'Unknown Class' };
        } else {
          return { ...subject, source: 'personal' };
        }
      });
      setAllSubjects(extendedSubjects);
      setAllClasses(userClasses);
      setSubjects(extendedSubjects);
      setClasses(userClasses);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data (subjects/classes)
  React.useEffect(() => {
    if (!user?.uid || !user?.email) {
      setLoading(false);
      return;
    }
    loadData();
  }, [user]);

  // Manual mode handlers
  const addQuestion = () => {
    setQuestions([...questions, { question: "", options: ["", "", "", ""], correct: 0 }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) {
      alert("You must have at least one question");
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setQuestions(newQuestions);
  };

  const handleManualSubmit = async () => {
    if (!user?.uid) { alert("Please log in to create a quiz"); return; }
    if (!title.trim()) { alert("Please enter a quiz title"); return; }
    if (!subject) { alert("Please select a subject"); return; }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) { alert(`Please enter question ${i + 1}`); return; }
      if (q.options.some(option => !option.trim())) { alert(`Please fill all options for question ${i + 1}`); return; }
    }
    try {
      setSaving(true);
      const selectedSubjectObj = subjects.find(s => s.name === subject);
      const quizData: any = {
        title: title.trim(),
        subject: subject,
        questions: questions,
        userId: user.uid,
        isPersonal: !selectedClass || selectedClass === ""
      };
      if (description.trim()) quizData.description = description.trim();
      if (selectedSubjectObj?.id) quizData.subjectId = selectedSubjectObj.id;
      if (selectedClass) quizData.classId = selectedClass;
      await createQuiz(quizData);
      alert("Quiz created successfully!");
      setTitle(""); setSubject(""); setSelectedClass(""); setDescription(""); setQuestions([{ question: "", options: ["", "", "", ""], correct: 0 }]);
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert("Failed to create quiz. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // AI mode handlers
  const parseQuizQuestions = (text: string) => {
    const questions = [];
    const questionBlocks = text.split(/\n\s*\n/).filter(block => block.trim());
    for (const block of questionBlocks) {
      const lines = block.split('\n').map(line => line.trim()).filter(line => line);
      if (lines.length < 5) continue;
      const question = lines[0].replace(/^\d+\.\s*/, '');
      const options = [];
      let correctIndex = 0;
      for (let i = 1; i < Math.min(5, lines.length); i++) {
        let option = lines[i].replace(/^[A-Da-d][\)\.]\s*/, '');
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

  const copyPromptToClipboard = () => {
    const promptText = `Create a quiz with multiple choice questions on the topic: ${aiSelectedSubject || '[Your Topic]'} with the title: ${quizTitle || '[Your Quiz Title]'}.

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

  const handleAISubmit = async () => {
    if (!quizTitle.trim() || !aiSelectedSubject || !quizQuestions.trim() || !user?.uid) {
      alert("Please fill in all fields");
      return;
    }
    try {
      setCreating(true);
      const selectedSubjectObj = subjects.find(s => s.name === aiSelectedSubject);
      const quizData: any = {
        title: quizTitle.trim(),
        subject: aiSelectedSubject,
        questions: parseQuizQuestions(quizQuestions),
        userId: user.uid,
        isPersonal: !aiSelectedClass || aiSelectedClass === ""
      };
      if (aiSelectedClass) quizData.classId = aiSelectedClass;
      if (selectedSubjectObj?.id) quizData.subjectId = selectedSubjectObj.id;
      await createQuiz(quizData);
      alert("Quiz created successfully!");
      setQuizTitle(""); setQuizQuestions(""); setAiSelectedSubject(""); setAiSelectedClass("");
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert("Failed to create quiz. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-5xl font-black mb-6 text-white">Create or Generate Quiz</h1>
          <p className="text-xl text-slate-300 mb-8">Please log in to create or generate quizzes.</p>
          <Link href="/" className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold text-lg hover:scale-105 transition-all duration-300 shadow-glow">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <SideNav />
      <div className="md:ml-64 min-h-screen p-4 md:p-8">
        <div className="relative z-10 mb-8">
          <div className="glass-card rounded-3xl p-8 md:p-12 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border-2 border-white/10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl md:text-6xl font-black mb-3 text-white">Quiz Creator</h1>
              <p className="text-slate-300 text-lg">Create quizzes manually or with AI</p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setMode('manual')} className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-glow ${mode === 'manual' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' : 'bg-white/10 text-slate-200 hover:bg-white/20'}`}>Manual</button>
              <button onClick={() => setMode('ai')} className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-glow ${mode === 'ai' ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white' : 'bg-white/10 text-slate-200 hover:bg-white/20'}`}>AI Generator</button>
            </div>
          </div>
        </div>
        {mode === 'manual' ? (
          <div className="glass-card rounded-3xl p-8 md:p-12 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-white/10">
            <h1 className="text-3xl font-bold mb-6 text-white">Create Quiz (Manual)</h1>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mb-4"></div>
                <p className="text-white text-lg font-medium">Loading...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Quiz Title *</label>
                    <input className="w-full p-3 border border-white/30 bg-white/10 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="Enter quiz title..." value={title} onChange={e => setTitle(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Subject *</label>
                    <select className="w-full p-3 border border-white/30 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 [&>option]:bg-slate-800 [&>option]:text-white" value={subject} onChange={e => setSubject(e.target.value)}>
                      <option value="">Select subject</option>
                      {subjects.map(s => (<option key={s.id} value={s.name}>{s.source === 'class' ? `${s.name} (${s.className})` : s.name}</option>))}
                    </select>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Add to Class (Optional)</label>
                    <select className="w-full p-3 border border-white/30 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 [&>option]:bg-slate-800 [&>option]:text-white" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                      <option value="">Personal quiz (no class)</option>
                      {classes.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
                    <textarea className="w-full p-3 border border-white/30 bg-white/10 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400" rows={3} placeholder="Brief description..." value={description} onChange={e => setDescription(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-white">Questions ({questions.length})</h2>
                    <button onClick={addQuestion} className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:scale-105 transition-all font-medium">➕ Add Question</button>
                  </div>
                  {questions.map((q, i) => (
                    <div key={i} className="bg-white/5 rounded-lg p-6 border border-white/20">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-white">Question {i + 1}</h3>
                        {questions.length > 1 && (<button onClick={() => removeQuestion(i)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm">🗑️ Remove</button>)}
                      </div>
                      <div className="space-y-4">
                        <input className="w-full p-3 border border-white/30 bg-white/10 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="Enter your question..." value={q.question} onChange={e => updateQuestion(i, { question: e.target.value })} />
                        <div className="grid md:grid-cols-2 gap-3">
                          {q.options.map((option, oi) => (
                            <div key={oi} className="flex items-center gap-3">
                              <input type="radio" name={`correct-${i}`} checked={q.correct === oi} onChange={() => updateQuestion(i, { correct: oi })} className="text-green-500" />
                              <input className="flex-1 p-2 border border-white/30 bg-white/10 text-white placeholder-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-green-400" placeholder={`Option ${oi + 1}`} value={option} onChange={e => { const opts = [...q.options]; opts[oi] = e.target.value; updateQuestion(i, { options: opts }); }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center pt-6">
                  <button onClick={handleManualSubmit} disabled={saving} className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:scale-105 transition-all shadow-lg disabled:opacity-50">{saving ? "Creating Quiz..." : "🚀 Create Quiz"}</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-card rounded-3xl p-8 md:p-12 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border-2 border-white/10">
            <h1 className="text-3xl font-bold mb-6 text-white">AI Quiz Generator</h1>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-cyan-500 border-t-transparent mb-4"></div>
                <p className="text-white text-lg font-medium">Loading...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Quiz Title *</label>
                    <input className="w-full p-3 border border-white/30 bg-white/10 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400" placeholder="Enter quiz title..." value={quizTitle} onChange={e => setQuizTitle(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Subject *</label>
                    <select className="w-full p-3 border border-white/30 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 [&>option]:bg-slate-800 [&>option]:text-white" value={aiSelectedSubject} onChange={e => setAiSelectedSubject(e.target.value)}>
                      <option value="">Select subject</option>
                      {subjects.map(s => (<option key={s.id} value={s.name}>{s.source === 'class' ? `${s.name} (${s.className})` : s.name}</option>))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Add to Class (Optional)</label>
                  <select className="w-full p-3 border border-white/30 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 [&>option]:bg-slate-800 [&>option]:text-white" value={aiSelectedClass} onChange={e => setAiSelectedClass(e.target.value)}>
                    <option value="">Personal quiz (no class)</option>
                    {classes.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-300">Quiz Questions *</label>
                    <button
                      onClick={copyPromptToClipboard}
                      className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1"
                    >
                      {copied ? '✓ Copied!' : '📋 Copy Prompt'}
                    </button>
                  </div>
                  <textarea className="w-full p-3 border border-white/30 bg-white/10 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 font-mono text-sm" rows={15} placeholder={"Paste your AI-generated quiz here...\n\nFormat:\n1. Question text?\nA) Option 1\nB) Option 2*\nC) Option 3\nD) Option 4\n\n(Mark correct answer with *)"} value={quizQuestions} onChange={e => setQuizQuestions(e.target.value)} />
                  <div className="mt-3 p-3 bg-purple-500/10 rounded-lg border border-purple-400/30">
                    <p className="text-xs text-purple-200 mb-2">💡 Click "Copy Prompt" above, then paste it into any AI tool:</p>
                    <div className="flex flex-wrap gap-2">
                      <a href="https://chat.deepseek.com" target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded text-xs font-medium transition-all">DeepSeek AI</a>
                      <a href="https://gemini.google.com" target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded text-xs font-medium transition-all">Google Gemini</a>
                      <a href="https://chat.openai.com" target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded text-xs font-medium transition-all">ChatGPT</a>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center pt-6">
                  <button onClick={handleAISubmit} disabled={creating} className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold rounded-lg hover:scale-105 transition-all shadow-lg disabled:opacity-50">{creating ? "Creating Quiz..." : "🚀 Create Quiz"}</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
