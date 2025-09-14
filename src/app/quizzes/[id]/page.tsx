"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from '@/contexts/AuthContext';
import { getQuizById, FirebaseQuiz } from '@/lib/firestore';

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

  useEffect(() => {
    if (!user?.uid) {
      router.push('/');
      return;
    }
    
    loadQuiz();
  }, [params.id, user]);

  const loadQuiz = async () => {
    if (!params.id) return;
    
    try {
      const quizData = await getQuizById(params.id as string);
      
      if (!quizData) {
        router.push("/quizzes");
        return;
      }

      setQuiz(quizData);
      setSelectedAnswers(new Array(quizData.questions.length).fill(-1));
      setTimeLeft(quizData.questions.length * 60); // 1 minute per question
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

  const handleStartQuiz = () => {
    setQuizStarted(true);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
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

  const handleFinishQuiz = () => {
    if (!quiz || !user?.email) return;

    let correctCount = 0;
    quiz.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct) {
        correctCount++;
      }
    });

    setScore(correctCount);
    setShowResults(true);

    // TODO: Save score to Firebase for leaderboard functionality
    // This would require implementing a scores collection in Firestore
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
          <p className="text-purple-200 mb-4">The quiz you're looking for doesn't exist.</p>
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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 text-white flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-4 text-center">
          <h1 className="text-3xl font-bold mb-6">Quiz Complete! 🎉</h1>
          
          <div className="space-y-4">
            <div className={`text-6xl ${passed ? 'text-green-400' : 'text-yellow-400'}`}>
              {passed ? '🏆' : '📚'}
            </div>
            
            <h2 className="text-2xl font-semibold">{quiz.title}</h2>
            
            <div className="bg-white/20 rounded-lg p-6">
              <div className="text-4xl font-bold mb-2">
                {score}/{quiz.questions.length}
              </div>
              <div className="text-xl mb-2">{percentage}%</div>
              <div className={`text-lg font-semibold ${passed ? 'text-green-400' : 'text-yellow-400'}`}>
                {passed ? '🎉 Great Job!' : '📖 Keep Learning!'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-green-500/20 rounded-lg p-3">
                <div className="text-green-400 font-semibold">✅ Correct</div>
                <div className="text-2xl">{score}</div>
              </div>
              <div className="bg-red-500/20 rounded-lg p-3">
                <div className="text-red-400 font-semibold">❌ Incorrect</div>
                <div className="text-2xl">{quiz.questions.length - score}</div>
              </div>
            </div>

            <div className="flex gap-4 justify-center mt-6">
              <Link 
                href="/quizzes" 
                className="px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
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
                className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                🔄 Retake Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 text-white">
      <div className="container mx-auto px-4 py-6">
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
    </div>
  );
}
