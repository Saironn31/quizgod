"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from '@/contexts/AuthContext';
import { getQuizById, FirebaseQuiz, saveQuizRecord, createLiveQuizSession, joinLiveQuizSession, getUserProfile, updateQuiz } from '@/lib/firestore';
import SideNav from '@/components/SideNav';
import Link from 'next/link';

export default function QuizPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userProfile } = useAuth();
  const [quiz, setQuiz] = useState<FirebaseQuiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [textAnswers, setTextAnswers] = useState<string[]>([]); // For fill-blank and short-answer
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedQuestions, setEditedQuestions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // Load quiz progress from localStorage
  const loadQuizProgress = () => {
    if (!user?.uid || !params.id) return;
    
    const progressKey = `quiz_progress_${user.uid}_${params.id}`;
    const savedProgress = localStorage.getItem(progressKey);
    
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        setCurrentQuestionIndex(progress.currentQuestionIndex || 0);
        setSelectedAnswers(progress.selectedAnswers || []);
        setTextAnswers(progress.textAnswers || []);
        setTimeLeft(progress.timeLeft || 0);
        setQuizStarted(progress.quizStarted || false);
        setShowResults(progress.showResults || false);
        setScore(progress.score || 0);
      } catch (error) {
        console.error('Failed to load quiz progress:', error);
        // Clear corrupted data
        localStorage.removeItem(progressKey);
      }
    }
  };

  // Save quiz progress to localStorage
  const saveQuizProgress = () => {
    if (!user?.uid || !params.id || showResults) return;
    
    const progressKey = `quiz_progress_${user.uid}_${params.id}`;
    const progress = {
      currentQuestionIndex,
      selectedAnswers,
      textAnswers,
      timeLeft,
      quizStarted,
      showResults,
      score,
      timestamp: Date.now()
    };
    
    localStorage.setItem(progressKey, JSON.stringify(progress));
  };

  // Clear quiz progress
  const clearQuizProgress = () => {
    if (!user?.uid || !params.id) return;
    
    const progressKey = `quiz_progress_${user.uid}_${params.id}`;
    localStorage.removeItem(progressKey);
  };

  useEffect(() => {
    loadQuiz();
  }, [params.id]);

  // Check for edit parameter on mount
  useEffect(() => {
    const editParam = searchParams.get('edit');
    if (editParam === 'true' && quiz && user?.uid === quiz.userId) {
      handleEnterEditMode();
    }
  }, [searchParams, quiz, user?.uid]);

  const loadQuiz = async () => {
    if (!params.id) return;
    
    try {
      const quizData = await getQuizById(params.id as string);
      
      if (!quizData) {
        router.push("/quizzes");
        return;
      }

      setQuiz(quizData);
      
      // Load saved progress or initialize new quiz
      const progressKey = `quiz_progress_${user?.uid}_${params.id}`;
      const savedProgress = localStorage.getItem(progressKey);
      
      if (savedProgress) {
        try {
          const progress = JSON.parse(savedProgress);
          // Check if progress is recent (within last 24 hours)
          const isRecent = progress.timestamp && (Date.now() - progress.timestamp) < 24 * 60 * 60 * 1000;
          
          if (isRecent) {
            setCurrentQuestionIndex(progress.currentQuestionIndex || 0);
            setSelectedAnswers(progress.selectedAnswers || new Array(quizData.questions.length).fill(-1));
            setTimeLeft(progress.timeLeft || quizData.questions.length * 60);
            setQuizStarted(progress.quizStarted || false);
            setShowResults(progress.showResults || false);
            setScore(progress.score || 0);
          } else {
            // Clear old progress
            localStorage.removeItem(progressKey);
            setSelectedAnswers(new Array(quizData.questions.length).fill(-1));
            setTimeLeft(quizData.questions.length * 60);
          }
        } catch (error) {
          console.error('Failed to load quiz progress:', error);
          localStorage.removeItem(progressKey);
          setSelectedAnswers(new Array(quizData.questions.length).fill(-1));
          setTimeLeft(quizData.questions.length * 60);
        }
      } else {
        setSelectedAnswers(new Array(quizData.questions.length).fill(-1));
        setTextAnswers(new Array(quizData.questions.length).fill(''));
        // Initialize timer based on quiz settings
        if (quizData.timerType === 'whole-quiz' && quizData.timerDuration) {
          setTimeLeft(quizData.timerDuration);
        } else if (quizData.timerType === 'per-question' && quizData.timerDuration) {
          setTimeLeft(quizData.timerDuration);
        } else {
          setTimeLeft(quizData.questions.length * 60);
        }
      }
    } catch (error) {
      console.error("Error loading quiz:", error);
      router.push("/quizzes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quizStarted && timeLeft > 0 && !showResults && quiz) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && quizStarted && quiz) {
      // Handle timer expiry based on timer type
      if (quiz.timerType === 'per-question') {
        // Auto-advance to next question
        if (currentQuestionIndex < quiz.questions.length - 1) {
          handleNextQuestion();
        } else {
          handleFinishQuiz();
        }
      } else if (quiz.timerType === 'whole-quiz') {
        // Auto-submit quiz
        handleFinishQuiz();
      }
    }
  }, [timeLeft, quizStarted, showResults, quiz, currentQuestionIndex]);

  // Auto-save progress when question changes or time updates
  useEffect(() => {
    if (quizStarted && !showResults && user?.uid && params.id) {
      const progressKey = `quiz_progress_${user.uid}_${params.id}`;
      const progress = {
        currentQuestionIndex,
        selectedAnswers,
        timeLeft,
        quizStarted,
        showResults,
        score,
        timestamp: Date.now()
      };
      localStorage.setItem(progressKey, JSON.stringify(progress));
    }
  }, [currentQuestionIndex, selectedAnswers, timeLeft, quizStarted, showResults, score, user?.uid, params.id]);

  const handleStartQuiz = () => {
    if (!quiz || !user) return;
    
    setQuizStarted(true);
    
    // Save initial progress to localStorage
    const progressKey = `quiz_progress_${user.uid}_${params.id}`;
    const progress = {
      currentQuestionIndex: 0,
      selectedAnswers: new Array(quiz.questions.length).fill(-1),
      timeLeft: quiz.questions.length * 60,
      quizStarted: true,
      showResults: false,
      score: 0,
      timestamp: Date.now()
    };
    localStorage.setItem(progressKey, JSON.stringify(progress));
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (!quiz || !user) return;
    
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
    
    // Save progress to localStorage
    const progressKey = `quiz_progress_${user.uid}_${params.id}`;
    const progress = {
      currentQuestionIndex,
      selectedAnswers: newAnswers,
      textAnswers,
      timeLeft,
      quizStarted,
      showResults,
      score,
      timestamp: Date.now()
    };
    localStorage.setItem(progressKey, JSON.stringify(progress));
  };

  const handleTextAnswerChange = (text: string) => {
    if (!quiz || !user) return;
    
    const newTextAnswers = [...textAnswers];
    newTextAnswers[currentQuestionIndex] = text;
    setTextAnswers(newTextAnswers);
    
    // Save progress to localStorage
    const progressKey = `quiz_progress_${user.uid}_${params.id}`;
    const progress = {
      currentQuestionIndex,
      selectedAnswers,
      textAnswers: newTextAnswers,
      timeLeft,
      quizStarted,
      showResults,
      score,
      timestamp: Date.now()
    };
    localStorage.setItem(progressKey, JSON.stringify(progress));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      
      // Reset timer for per-question mode
      if (quiz?.timerType === 'per-question' && quiz?.timerDuration) {
        setTimeLeft(quiz.timerDuration);
      }
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleFinishQuiz = async () => {
    if (!quiz || !user?.uid) return;

    let correctCount = 0;
    const mistakes: Array<{ question: string; selected: number; correct: number }> = [];
    
    quiz.questions.forEach((question, index) => {
      const questionType = question.type || 'multiple-choice';
      let isCorrect = false;

      if (questionType === 'multiple-choice' || questionType === 'true-false') {
        const correctIdx = typeof question.correct === 'number' ? question.correct : question.correct[0];
        isCorrect = selectedAnswers[index] === correctIdx;
      } else if (questionType === 'fill-blank' || questionType === 'short-answer') {
        const userAnswer = textAnswers[index]?.trim().toLowerCase() || '';
        const correctAnswer = question.options[0]?.trim().toLowerCase() || '';
        
        // Flexible matching - consider correct if similar
        if (questionType === 'fill-blank') {
          isCorrect = userAnswer === correctAnswer;
        } else {
          // For short answer, allow partial match
          isCorrect = userAnswer.includes(correctAnswer) || correctAnswer.includes(userAnswer);
        }
      }

      if (isCorrect) {
        correctCount++;
      } else {
        mistakes.push({
          question: question.question,
          selected: selectedAnswers[index],
          correct: typeof question.correct === 'number' ? question.correct : question.correct[0]
        });
      }
    });

    const percentage = Math.round((correctCount / quiz.questions.length) * 100);
    setScore(correctCount);
    setShowResults(true);

    // Save quiz record to Firestore
    try {
      await saveQuizRecord({
        userId: user.uid,
        quizId: quiz.id,
        score: correctCount,
        percentage: percentage,
        mistakes,
        selectedAnswers,
        timestamp: new Date()
      });
      
      // Clear saved progress after successful save
      const progressKey = `quiz_progress_${user.uid}_${params.id}`;
      localStorage.removeItem(progressKey);
    } catch (err) {
      console.error('Failed to save quiz record:', err);
    }
  };

  const handleEnterEditMode = async () => {
    if (!quiz || !user?.uid) {
      alert('Please log in to edit quizzes.');
      return;
    }
    
    if (quiz.userId !== user?.uid) {
      alert('You can only edit quizzes you created.');
      return;
    }
    
    // Fetch fresh user profile to ensure we have latest premium status
    try {
      const freshProfile = await getUserProfile(user.uid);
      const hasPremiumAccess = freshProfile?.isPremium === true || freshProfile?.role === 'admin';
      console.log('User profile premium status:', hasPremiumAccess);
      
      if (!hasPremiumAccess) {
        alert('Edit mode is a premium feature. Please upgrade to edit quizzes.');
        router.push('/premium');
        return;
      }
      
      setIsEditMode(true);
      setEditedQuestions(JSON.parse(JSON.stringify(quiz.questions)));
    } catch (error) {
      console.error('Error checking premium status:', error);
      alert('Failed to verify premium status. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    if (confirm('Discard all changes?')) {
      setIsEditMode(false);
      setEditedQuestions([]);
    }
  };

  const handleSaveEdit = async () => {
    if (!quiz || !user?.uid) return;
    
    // Validate edited questions
    for (let i = 0; i < editedQuestions.length; i++) {
      const q = editedQuestions[i];
      if (!q.question.trim()) {
        alert(`Question ${i + 1} cannot be empty`);
        return;
      }
      if (q.type !== 'fill-blank' && q.type !== 'short-answer') {
        if (q.options.some((opt: string) => !opt.trim())) {
          alert(`All options for question ${i + 1} must be filled`);
          return;
        }
      }
    }
    
    try {
      setSaving(true);
      await updateQuiz(quiz.id, { questions: editedQuestions });
      
      // Update local state
      setQuiz({ ...quiz, questions: editedQuestions });
      setIsEditMode(false);
      alert('Quiz updated successfully!');
    } catch (error) {
      console.error('Error updating quiz:', error);
      alert('Failed to update quiz. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateEditedQuestion = (index: number, field: string, value: any) => {
    const updated = [...editedQuestions];
    if (field === 'option') {
      updated[index].options[value.index] = value.text;
    } else {
      updated[index][field] = value;
    }
    setEditedQuestions(updated);
  };

  const addNewQuestion = (type: 'multiple-choice' | 'true-false' | 'fill-blank') => {
    const newQuestion: any = {
      question: '',
      type: type,
      correct: 0,
      options: []
    };

    if (type === 'multiple-choice') {
      newQuestion.options = ['', '', '', ''];
    } else if (type === 'true-false') {
      newQuestion.options = ['True', 'False'];
    } else if (type === 'fill-blank') {
      newQuestion.options = [''];
    }

    setEditedQuestions([...editedQuestions, newQuestion]);
  };

  const removeQuestion = (index: number) => {
    if (editedQuestions.length === 1) {
      alert('Quiz must have at least one question');
      return;
    }
    
    if (confirm(`Delete question ${index + 1}?`)) {
      const updated = editedQuestions.filter((_, i) => i !== index);
      setEditedQuestions(updated);
    }
  };

  const changeQuestionType = (index: number, newType: 'multiple-choice' | 'true-false' | 'fill-blank') => {
    const updated = [...editedQuestions];
    const currentQuestion = updated[index];
    
    // Update type
    currentQuestion.type = newType;
    
    // Update options based on new type
    if (newType === 'multiple-choice') {
      currentQuestion.options = ['', '', '', ''];
      currentQuestion.correct = 0;
    } else if (newType === 'true-false') {
      currentQuestion.options = ['True', 'False'];
      currentQuestion.correct = 0;
    } else if (newType === 'fill-blank') {
      currentQuestion.options = [''];
      currentQuestion.correct = 0;
    }
    
    setEditedQuestions(updated);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold mb-4">Loading Quiz...</h1>
          <p className="text-purple-200">Please wait while we fetch your quiz</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-4">Quiz Not Found</h1>
          <p className="text-purple-200 mb-4">The quiz you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/quizzes" className="text-blue-400 hover:underline">
            ← Back to Quizzes
          </Link>
        </div>
      </div>
    );
  }

  // Edit Mode Screen - Check this BEFORE quizStarted
  if (isEditMode) {
    return (
      <div className="min-h-screen bg-slate-950">
        <SideNav />
        <div className="md:ml-64 min-h-screen p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-white">✏️ Edit Quiz: {quiz.title}</h1>
                <div className="flex gap-3">
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
                  >
                    {saving ? '💾 Saving...' : '💾 Save Changes'}
                  </button>
                </div>
              </div>
              
              <div className="space-y-6">
                {editedQuestions.map((question, qIndex) => {
                  const questionType = question.type || 'multiple-choice';
                  
                  return (
                    <div key={qIndex} className="bg-white/5 rounded-xl p-6 border border-white/10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <label className="text-sm text-purple-200 font-semibold">Question {qIndex + 1}</label>
                          <select
                            value={questionType}
                            onChange={(e) => changeQuestionType(qIndex, e.target.value as any)}
                            className="px-3 py-1 text-xs bg-purple-500/30 border border-purple-400/50 rounded-full text-purple-200 cursor-pointer hover:bg-purple-500/50 transition-colors"
                          >
                            <option value="multiple-choice">Multiple Choice</option>
                            <option value="true-false">True/False</option>
                            <option value="fill-blank">Fill in the Blank</option>
                          </select>
                        </div>
                        <button
                          onClick={() => removeQuestion(qIndex)}
                          className="px-3 py-1 bg-red-600/80 hover:bg-red-600 rounded-lg text-xs font-semibold transition-colors"
                          title="Delete question"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                      
                      <textarea
                        value={question.question}
                        onChange={(e) => updateEditedQuestion(qIndex, 'question', e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-white/10 text-white border border-white/20 focus:border-purple-400 focus:outline-none mb-4"
                        rows={2}
                        placeholder="Enter question text"
                      />

                      {/* Image URL (Optional) */}
                      <div className="mb-4">
                        <label className="text-sm text-purple-200 mb-2 block">🖼️ Image URL (Optional):</label>
                        <input
                          type="text"
                          value={question.imageUrl || ''}
                          onChange={(e) => updateEditedQuestion(qIndex, 'imageUrl', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 focus:border-purple-400 focus:outline-none"
                          placeholder="Enter image URL (e.g., https://example.com/image.png)"
                        />
                        {question.imageUrl && (
                          <div className="mt-3">
                            <img 
                              src={question.imageUrl} 
                              alt="Question preview" 
                              className="max-h-48 rounded-lg border border-white/20"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                      
                      {questionType === 'fill-blank' || questionType === 'short-answer' ? (
                        <div>
                          <label className="text-sm text-purple-200 mb-2 block">Correct Answer:</label>
                          <input
                            type="text"
                            value={question.options[0] || ''}
                            onChange={(e) => updateEditedQuestion(qIndex, 'option', { index: 0, text: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 focus:border-purple-400 focus:outline-none"
                            placeholder="Enter correct answer"
                          />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <label className="text-sm text-purple-200">Options:</label>
                          {question.options.map((option: string, oIndex: number) => (
                            <div key={oIndex} className="flex items-center gap-3">
                              <input
                                type="radio"
                                checked={question.correct === oIndex}
                                onChange={() => updateEditedQuestion(qIndex, 'correct', oIndex)}
                                className="w-5 h-5 cursor-pointer"
                              />
                              <span className="text-white font-semibold min-w-[24px]">
                                {String.fromCharCode(65 + oIndex)})
                              </span>
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => updateEditedQuestion(qIndex, 'option', { index: oIndex, text: e.target.value })}
                                className="flex-1 px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 focus:border-purple-400 focus:outline-none"
                                placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                              />
                            </div>
                          ))}
                          <p className="text-xs text-purple-300 mt-2">
                            💡 Select the correct answer by clicking the radio button
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add New Question Buttons */}
                <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl p-6 border-2 border-dashed border-purple-400/50">
                  <p className="text-white font-semibold mb-4 text-center">➕ Add New Question</p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <button
                      onClick={() => addNewQuestion('multiple-choice')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
                    >
                      📝 Multiple Choice
                    </button>
                    <button
                      onClick={() => addNewQuestion('true-false')}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
                    >
                      ✓✗ True/False
                    </button>
                    <button
                      onClick={() => addNewQuestion('fill-blank')}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
                    >
                      ✍️ Fill in Blank
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-slate-950">
        <SideNav />
        <div className="md:ml-64 min-h-screen p-4 md:p-8 pb-32 md:pb-8">
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-500/5 rounded-full filter blur-3xl animate-float"></div>
            <div className="absolute bottom-20 left-20 w-96 h-96 bg-violet-500/5 rounded-full filter blur-3xl animate-float" style={{animationDelay: '1.5s'}}></div>
          </div>
          
          {/* Header Card */}
          <div className="relative z-10 mb-8">
            <div className="glass-card rounded-3xl p-8 md:p-12 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-2 border-white/10">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h1 className="text-4xl md:text-6xl font-black mb-3">
                    <span className="text-white">{quiz.title}</span>
                  </h1>
                  <p className="text-slate-300 text-lg">📚 {quiz.subject}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quiz Info Bento Grid */}
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-400/30 hover:scale-105 transition-all">
              <div className="text-sm text-blue-200 mb-2 font-medium">Questions</div>
              <div className="text-4xl font-black text-blue-300">{quiz.questions.length}</div>
              <div className="text-xs text-blue-300/60 mt-1">Total</div>
            </div>
            
            <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-400/30 hover:scale-105 transition-all">
              <div className="text-sm text-purple-200 mb-2 font-medium">Difficulty</div>
              <div className="text-2xl font-black text-purple-300 capitalize">{quiz.difficulty || 'Medium'}</div>
              <div className="text-xs text-purple-300/60 mt-1">Level</div>
            </div>

            <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-400/30 hover:scale-105 transition-all">
              <div className="text-sm text-green-200 mb-2 font-medium">Timer</div>
              <div className="text-2xl font-black text-green-300">
                {quiz.timerType && quiz.timerType !== 'none' 
                  ? (quiz.timerType === 'per-question' ? `${quiz.timerDuration || 60}s` : `${Math.floor((quiz.timerDuration || 0) / 60)}m`)
                  : 'None'}
              </div>
              <div className="text-xs text-green-300/60 mt-1">
                {quiz.timerType === 'per-question' ? 'Per Q' : quiz.timerType === 'whole-quiz' ? 'Total' : 'Unlimited'}
              </div>
            </div>
            
            <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-400/30 hover:scale-105 transition-all">
              <div className="text-sm text-orange-200 mb-2 font-medium">Type</div>
              <div className="text-xl font-black text-orange-300 capitalize">
                {quiz.questions[0]?.type?.split('-').join(' ') || 'Multiple Choice'}
              </div>
              <div className="text-xs text-orange-300/60 mt-1">Format</div>
            </div>
          </div>

          {/* Description Card */}
          {quiz.description && (
            <div className="relative z-10 glass-card rounded-3xl p-6 mb-8">
              <h3 className="text-xl font-bold text-white mb-3">Description</h3>
              <p className="text-slate-300">{quiz.description}</p>
            </div>
          )}

          {/* Action Buttons - Bento Grid */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link 
              href="/quizzes" 
              className="glass-card rounded-2xl p-6 bg-gradient-to-br from-gray-500/10 to-gray-600/10 border border-gray-400/30 hover:scale-105 transition-all text-center group"
            >
              <div className="text-4xl mb-3">←</div>
              <div className="text-xl font-bold text-white mb-2">Back to Quizzes</div>
              <div className="text-sm text-gray-300">Return to quiz list</div>
            </Link>

            {quiz.userId === user?.uid && (
              <button
                onClick={handleEnterEditMode}
                className="glass-card rounded-2xl p-6 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-400/30 hover:scale-105 transition-all text-center group"
              >
                <div className="text-4xl mb-3">✏️</div>
                <div className="text-xl font-bold text-white mb-2">Edit Quiz</div>
                <div className="text-sm text-yellow-300">
                  {(userProfile?.role === 'admin' || (userProfile?.isPremium && userProfile?.premiumStatus === 'active')) ? 'Modify questions' : '⭐ Premium Feature'}
                </div>
              </button>
            )}

            <button
              onClick={handleStartQuiz}
              className="glass-card rounded-2xl p-6 bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-400/30 hover:scale-105 transition-all text-center group"
            >
              <div className="text-4xl mb-3">🚀</div>
              <div className="text-xl font-bold text-white mb-2">Start Solo Quiz</div>
              <div className="text-sm text-green-300">Play by yourself</div>
            </button>

            {quiz.classId && (
              <button
                onClick={async () => {
                  if (!user) return;
                  try {
                    const userProfile = await getUserProfile(user.uid);
                    const sessionId = await createLiveQuizSession(
                      quiz.id,
                      quiz.title,
                      quiz.classId!,
                      user.uid,
                      userProfile?.name || user.email || 'Anonymous'
                    );
                    // Join the session as host
                    await joinLiveQuizSession(
                      sessionId,
                      user.uid,
                      userProfile?.name || user.email || 'Anonymous',
                      user.email || ''
                    );
                    router.push(`/live-quiz/${sessionId}`);
                  } catch (error) {
                    console.error('Error creating live session:', error);
                    alert('Failed to create live quiz session');
                  }
                }}
                className="glass-card rounded-2xl p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-400/30 hover:scale-105 transition-all text-center group"
              >
                <div className="text-4xl mb-3">🎮</div>
                <div className="text-xl font-bold text-white mb-2">Live Multiplayer</div>
                <div className="text-sm text-purple-300">Play with classmates</div>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    const percentage = Math.round((score / quiz.questions.length) * 100);
    const passed = percentage >= 70;

    return (
      <div className="min-h-screen bg-slate-950">
        <SideNav />
        <div className="md:ml-64 min-h-screen p-4 md:p-8 pb-32 md:pb-8">
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-500/5 rounded-full filter blur-3xl animate-float"></div>
            <div className="absolute bottom-20 left-20 w-96 h-96 bg-violet-500/5 rounded-full filter blur-3xl animate-float" style={{animationDelay: '1.5s'}}></div>
          </div>
          
          {/* Header Card */}
          <div className="relative z-10 mb-8">
            <div className="glass-card rounded-3xl p-8 md:p-12 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-2 border-white/10 text-center animate-slide-up">
              <div className={`text-6xl md:text-7xl mb-4 ${passed ? 'text-green-400' : 'text-yellow-400'}`}>
                {passed ? '🏆' : '📚'}
              </div>
              <h1 className="text-3xl md:text-5xl font-black mb-3">
                <span className="text-white">Quiz Complete!</span>
              </h1>
              <h2 className="text-xl md:text-2xl text-slate-300 font-semibold">{quiz.title}</h2>
            </div>
          </div>

          {/* Bento Grid Stats */}
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-400/30 hover:scale-105 transition-all duration-300 animate-slide-up">
              <div className="text-sm text-blue-200 mb-2 font-medium">Your Score</div>
              <div className="text-4xl font-black text-blue-300 mb-1">{score}/{quiz.questions.length}</div>
              <div className="text-xs text-blue-300/60">Questions</div>
            </div>
            
            <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-400/30 hover:scale-105 transition-all duration-300 animate-slide-up" style={{animationDelay: '0.1s'}}>
              <div className="text-sm text-purple-200 mb-2 font-medium">Percentage</div>
              <div className="text-4xl font-black text-purple-300 mb-1">{percentage}%</div>
              <div className={`text-xs font-semibold ${passed ? 'text-green-400' : 'text-yellow-400'}`}>
                {passed ? '✓ Passed' : '! Review'}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-400/30 hover:scale-105 transition-all duration-300 animate-slide-up" style={{animationDelay: '0.2s'}}>
              <div className="text-sm text-green-200 mb-2 font-medium">✅ Correct</div>
              <div className="text-4xl font-black text-green-300 mb-1">{score}</div>
              <div className="text-xs text-green-300/60">Answers</div>
            </div>
            
            <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-400/30 hover:scale-105 transition-all duration-300 animate-slide-up" style={{animationDelay: '0.3s'}}>
              <div className="text-sm text-red-200 mb-2 font-medium">❌ Incorrect</div>
              <div className="text-4xl font-black text-red-300 mb-1">{quiz.questions.length - score}</div>
              <div className="text-xs text-red-300/60">Answers</div>
            </div>
          </div>

          {/* Detailed Results - Bento Card */}
          <div className="relative z-10 glass-card rounded-3xl p-6 animate-slide-up mb-8" style={{animationDelay: '0.4s'}}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-xl">
                📋
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white">Question Review</h3>
            </div>
            <div className="space-y-4">
              {quiz.questions.map((question, idx) => {
                const questionType = question.type || 'multiple-choice';
                let isCorrect = false;
                let correctText = '';
                let userText = '';

                if (questionType === 'multiple-choice' || questionType === 'true-false') {
                  const correctIdx = typeof question.correct === 'number' ? question.correct : question.correct[0];
                  const userIdx = selectedAnswers[idx];
                  correctText = question.options[correctIdx];
                  userText = userIdx !== -1 ? question.options[userIdx] : "No answer";
                  isCorrect = userIdx === correctIdx;
                } else if (questionType === 'fill-blank' || questionType === 'short-answer') {
                  correctText = question.options[0] || '';
                  userText = textAnswers[idx] || "No answer";
                  
                  const userLower = userText.trim().toLowerCase();
                  const correctLower = correctText.trim().toLowerCase();
                  
                  if (questionType === 'fill-blank') {
                    isCorrect = userLower === correctLower;
                  } else {
                    isCorrect = userLower.includes(correctLower) || correctLower.includes(userLower);
                  }
                }

                return (
                  <div key={idx} className={`rounded-xl p-4 md:p-5 border transition-all hover:scale-[1.01] ${
                    isCorrect 
                      ? 'border-green-400/30 bg-gradient-to-br from-green-500/10 to-green-600/10' 
                      : 'border-red-400/30 bg-gradient-to-br from-red-500/10 to-red-600/10'
                  }`}>
                    <div className="font-semibold text-white mb-3 text-sm md:text-base">Q{idx + 1}: {question.question}</div>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-green-400 text-xs md:text-sm shrink-0">✓ Correct:</span> 
                        <span className="text-slate-200 text-xs md:text-sm">{correctText}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-blue-400 text-xs md:text-sm shrink-0">→ Your Answer:</span> 
                        <span className={`text-xs md:text-sm ${isCorrect ? 'text-green-300' : 'text-red-300'}`}>{userText}</span>
                      </div>
                      <div>
                        {isCorrect ? (
                          <span className="inline-block px-3 py-1 rounded-lg bg-green-500/20 border border-green-400/30 text-green-300 text-xs font-bold">
                            ✓ Correct
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 rounded-lg bg-red-500/20 border border-red-400/30 text-red-300 text-xs font-bold">
                            ✗ Incorrect
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/quizzes" 
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold hover:scale-105 transition-all text-center"
            >
              📚 Back to Quizzes
            </Link>
            <button
              onClick={() => {
                setCurrentQuestionIndex(0);
                setSelectedAnswers(new Array(quiz.questions.length).fill(-1));
                setTextAnswers(new Array(quiz.questions.length).fill(''));
                setShowResults(false);
                setScore(0);
                // Reset timer based on quiz settings
                if (quiz.timerType === 'whole-quiz' && quiz.timerDuration) {
                  setTimeLeft(quiz.timerDuration);
                } else if (quiz.timerType === 'per-question' && quiz.timerDuration) {
                  setTimeLeft(quiz.timerDuration);
                } else {
                  setTimeLeft(quiz.questions.length * 60);
                }
                setQuizStarted(true);
              }}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:scale-105 transition-all"
            >
              🔄 Retake Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

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
                  <span className="text-white">Quiz Player</span>
                </h1>
                <p className="text-slate-300 text-lg">Take your quiz and track your progress</p>
              </div>
              <Link href="/quizzes" className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:scale-105 transition-all duration-300 shadow-glow">
                My Quizzes
              </Link>
            </div>
          </div>
        </div>
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="glass-card rounded-3xl p-6 md:col-span-2 animate-slide-up">
            <h3 className="text-xl font-bold text-white mb-4">Quiz</h3>

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold">{quiz.title}</h1>
                <p className="text-purple-200">Subject: {quiz.subject}</p>
              </div>
              {quiz.timerType && quiz.timerType !== 'none' && (
                <div className="text-right">
                  <div className={`text-2xl font-bold ${timeLeft <= 10 && quiz.timerType === 'per-question' ? 'text-red-400 animate-pulse' : ''} ${timeLeft <= 60 && quiz.timerType === 'whole-quiz' ? 'text-red-400 animate-pulse' : ''}`}>
                    ⏱️ {formatTime(timeLeft)}
                  </div>
                  <div className="text-sm text-purple-200">
                    {quiz.timerType === 'per-question' ? 'Per Question' : 'Total Time'}
                  </div>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-sm mb-2">
                <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-green-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Question */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                <h2 className="text-2xl font-semibold mb-6">
                  {currentQuestion.question}
                </h2>

                {/* Question Image */}
                {currentQuestion.imageUrl && (
                  <div className="mb-6 flex justify-center">
                    <img 
                      src={currentQuestion.imageUrl} 
                      alt="Question illustration" 
                      className="max-w-full h-auto max-h-80 rounded-xl border-2 border-white/20 shadow-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Multiple Choice */}
                {(!currentQuestion.type || currentQuestion.type === 'multiple-choice') && (
                  <div className="space-y-4">
                    {currentQuestion.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(index)}
                        className={`w-full p-4 rounded-lg text-left transition-all duration-200 ${
                          selectedAnswers[currentQuestionIndex] === index
                            ? 'bg-blue-600 border-2 border-blue-400'
                            : 'bg-white/20 hover:bg-white/30 border-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-center">
                          <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-4 font-semibold">
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span>{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* True/False */}
                {currentQuestion.type === 'true-false' && (
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleAnswerSelect(0)}
                      className={`p-6 rounded-xl text-center text-xl font-bold transition-all duration-200 ${
                        selectedAnswers[currentQuestionIndex] === 0
                          ? 'bg-green-600 border-2 border-green-400 scale-105'
                          : 'bg-white/20 hover:bg-white/30 border-2 border-transparent'
                      }`}
                    >
                      <div className="text-4xl mb-2">✓</div>
                      <div>TRUE</div>
                    </button>
                    <button
                      onClick={() => handleAnswerSelect(1)}
                      className={`p-6 rounded-xl text-center text-xl font-bold transition-all duration-200 ${
                        selectedAnswers[currentQuestionIndex] === 1
                          ? 'bg-red-600 border-2 border-red-400 scale-105'
                          : 'bg-white/20 hover:bg-white/30 border-2 border-transparent'
                      }`}
                    >
                      <div className="text-4xl mb-2">✗</div>
                      <div>FALSE</div>
                    </button>
                  </div>
                )}

                {/* Fill in the Blank */}
                {currentQuestion.type === 'fill-blank' && (
                  <div>
                    <input
                      type="text"
                      value={textAnswers[currentQuestionIndex] || ''}
                      onChange={(e) => handleTextAnswerChange(e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full p-4 rounded-lg bg-slate-900/50 border-2 border-white/30 focus:border-blue-400 focus:outline-none text-white placeholder-gray-400 text-lg"
                    />
                    <p className="text-sm text-purple-200 mt-2">💡 Hint: Be specific with your answer</p>
                  </div>
                )}

                {/* Short Answer */}
                {currentQuestion.type === 'short-answer' && (
                  <div>
                    <textarea
                      value={textAnswers[currentQuestionIndex] || ''}
                      onChange={(e) => handleTextAnswerChange(e.target.value)}
                      placeholder="Write your answer here (1-2 sentences)..."
                      rows={4}
                      className="w-full p-4 rounded-lg bg-slate-900/50 border-2 border-white/30 focus:border-blue-400 focus:outline-none text-white placeholder-gray-400 text-lg resize-none"
                    />
                    <p className="text-sm text-purple-200 mt-2">💡 Tip: Write a clear and concise answer</p>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-8">
                  <button
                    onClick={handlePrevQuestion}
                    disabled={currentQuestionIndex === 0}
                    className="px-6 py-3 bg-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                  >
                    ← Previous
                  </button>

                  <div className="flex gap-4">
                    {currentQuestionIndex === quiz.questions.length - 1 ? (
                      <button
                        onClick={handleFinishQuiz}
                        className="px-6 py-3 bg-green-600 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                      >
                        🏁 Finish Quiz
                      </button>
                    ) : (
                      <button
                        onClick={handleNextQuestion}
                        disabled={
                          (currentQuestion.type === 'fill-blank' || currentQuestion.type === 'short-answer')
                            ? !textAnswers[currentQuestionIndex]?.trim()
                            : selectedAnswers[currentQuestionIndex] === -1
                        }
                        className="px-6 py-3 bg-blue-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                      >
                        Next →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Question Navigator */}
            <div className="max-w-4xl mx-auto mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-3">Quick Navigation:</h3>
                <div className="flex flex-wrap gap-2">
                  {quiz.questions.map((q, index) => {
                    const isAnswered = (q.type === 'fill-blank' || q.type === 'short-answer')
                      ? !!textAnswers[index]?.trim()
                      : selectedAnswers[index] !== -1;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => setCurrentQuestionIndex(index)}
                        className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all ${
                          index === currentQuestionIndex
                            ? 'bg-blue-600 border-2 border-blue-400'
                            : isAnswered
                            ? 'bg-green-600/50 hover:bg-green-600'
                            : 'bg-white/20 hover:bg-white/30'
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-3xl p-6 md:col-span-1 animate-slide-up" style={{animationDelay: '0.1s'}}>
            {/* Quick Links removed */}
          </div>
        </div>
      </div>
    </div>
  );
}
