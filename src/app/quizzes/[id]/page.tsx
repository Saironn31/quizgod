"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from '@/contexts/AuthContext';
import { getQuizById, FirebaseQuiz, saveQuizRecord } from '@/lib/firestore';
import SideNav from '@/components/SideNav';
import Link from 'next/link';

export default function QuizPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<FirebaseQuiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [loading, setLoading] = useState(true);

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
        setTimeLeft(quizData.questions.length * 60);
      }
    } catch (error) {
      console.error("Error loading quiz:", error);
      router.push("/quizzes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quizStarted && timeLeft > 0 && !showResults) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && quizStarted) {
      handleFinishQuiz();
    }
  }, [timeLeft, quizStarted, showResults]);

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
      if (selectedAnswers[index] === question.correct) {
        correctCount++;
      } else {
        mistakes.push({
          question: question.question,
          selected: selectedAnswers[index],
          correct: question.correct
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

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 text-white flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-4">
          <h1 className="text-3xl font-bold mb-4 text-center">{quiz.title}</h1>
          <div className="text-center space-y-4">
            <p className="text-xl">📚 Subject: {quiz.subject}</p>
            {quiz.description && (
              <p className="text-gray-300">{quiz.description}</p>
            )}
            <div className="bg-white/20 rounded-lg p-4">
              <p className="text-lg">📊 Quiz Information:</p>
              <ul className="mt-2 space-y-1">
                <li>• Questions: {quiz.questions.length}</li>
                <li>• Time Limit: {formatTime(quiz.questions.length * 60)}</li>
                <li>• Type: Multiple Choice</li>
              </ul>
            </div>
            <div className="flex gap-4 justify-center mt-6">
              <Link 
                href="/quizzes" 
                className="px-6 py-3 bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
              >
                ← Back to Quizzes
              </Link>
              <button
                onClick={handleStartQuiz}
                className="px-6 py-3 bg-green-600 rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                🚀 Start Quiz
              </button>
            </div>
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
                const correctIdx = question.correct;
                const userIdx = selectedAnswers[idx];
                const correctText = question.options[correctIdx];
                const userText = userIdx !== -1 ? question.options[userIdx] : "No answer";
                const isCorrect = userIdx === correctIdx;
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
                setShowResults(false);
                setScore(0);
                setTimeLeft(quiz.questions.length * 60);
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
              <div className="text-right">
                <div className="text-2xl font-bold">⏱️ {formatTime(timeLeft)}</div>
                <div className="text-sm text-purple-200">Time Remaining</div>
              </div>
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
                        disabled={selectedAnswers[currentQuestionIndex] === -1}
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
                  {quiz.questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all ${
                        index === currentQuestionIndex
                          ? 'bg-blue-600 border-2 border-blue-400'
                          : selectedAnswers[index] !== -1
                          ? 'bg-green-600/50 hover:bg-green-600'
                          : 'bg-white/20 hover:bg-white/30'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
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
