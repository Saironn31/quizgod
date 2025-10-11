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

  // Load data (subjects/classes)
  React.useEffect(() => {
    if (!user?.uid || !user?.email) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const allSubjects = await getAllUserSubjects(user.uid, user.email);
      const userClasses = await getUserClasses(user.email);
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
      setLoading(false);
    })();
  }, [user]);

  // Manual mode handlers
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
            {/* Manual quiz creation form here (title, subject, class, questions, etc.) */}
            {/* ...existing manual form code from CreatePage... */}
          </div>
        ) : (
          <div className="glass-card rounded-3xl p-8 md:p-12 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border-2 border-white/10">
            <h1 className="text-3xl font-bold mb-6 text-white">AI Quiz Generator</h1>
            {/* AI quiz generation form here (quizTitle, quizQuestions, subject, class, etc.) */}
            {/* ...existing AI form code from AIQuizGenerator... */}
          </div>
        )}
      </div>
    </div>
  );
}
