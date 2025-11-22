"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from '@/contexts/AuthContext';
import { 
  getLiveQuizSession, 
  getQuizById, 
  subscribeToLiveQuizSession,
  submitLiveQuizAnswer,
  updateLiveQuizQuestion,
  startLiveQuizSession,
  finishLiveQuizSession,
  leaveLiveQuizSession,
  LiveQuizSession,
  FirebaseQuiz
} from '@/lib/firestore';
import Link from 'next/link';

export default function LiveQuizPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [session, setSession] = useState<LiveQuizSession | null>(null);
  const [quiz, setQuiz] = useState<FirebaseQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentAnswer, setCurrentAnswer] = useState<number | string | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);

  // Load session and quiz
  useEffect(() => {
    if (!params.sessionId || !user) return;

    const loadData = async () => {
      try {
        const sessionData = await getLiveQuizSession(params.sessionId as string);
        if (!sessionData) {
          router.push('/classes');
          return;
        }

        setSession(sessionData);

        const quizData = await getQuizById(sessionData.quizId);
        if (!quizData) {
          router.push('/classes');
          return;
        }

        setQuiz(quizData);
      } catch (error) {
        console.error('Error loading live quiz:', error);
        router.push('/classes');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params.sessionId, user, router]);

  // Subscribe to session updates
  useEffect(() => {
    if (!params.sessionId) return;

    const unsubscribe = subscribeToLiveQuizSession(
      params.sessionId as string,
      (updatedSession) => {
        if (updatedSession) {
          setSession(updatedSession);
          
          // Check if current player has answered current question
          const currentPlayer = updatedSession.players.find(p => p.userId === user?.uid);
          if (currentPlayer) {
            const hasAnsweredCurrent = currentPlayer.answers[updatedSession.currentQuestionIndex] !== undefined;
            setHasAnswered(hasAnsweredCurrent);
          }
        } else {
          router.push('/classes');
        }
      }
    );

    return () => unsubscribe();
  }, [params.sessionId, user?.uid, router]);

  const handleStartQuiz = async () => {
    if (!session || !user) return;
    
    try {
      // Start the session (changes status to 'in-progress')
      await startLiveQuizSession(session.id!);
      // Set the first question
      await updateLiveQuizQuestion(session.id!, 0);
      // Session status will update via real-time listener
    } catch (error) {
      console.error('Error starting quiz:', error);
      alert('Failed to start quiz. Please try again.');
    }
  };

  const handleAnswerSelect = (answer: number | string) => {
    setCurrentAnswer(answer);
  };

  const handleTextAnswerChange = (text: string) => {
    setTextAnswer(text);
    setCurrentAnswer(text);
  };

  const handleSubmitAnswer = async () => {
    if (!session || !quiz || !user || currentAnswer === null || hasAnswered) return;

    const currentQuestion = quiz.questions[session.currentQuestionIndex];
    const questionType = currentQuestion.type || 'multiple-choice';
    
    let isCorrect = false;

    // Validate answer based on question type
    if (questionType === 'multiple-choice' || questionType === 'true-false') {
      const correctIdx = typeof currentQuestion.correct === 'number' 
        ? currentQuestion.correct 
        : currentQuestion.correct[0];
      isCorrect = currentAnswer === correctIdx;
    } else if (questionType === 'fill-blank' || questionType === 'short-answer') {
      const userAnswer = String(currentAnswer).trim().toLowerCase();
      const correctAnswer = currentQuestion.options[0]?.trim().toLowerCase() || '';
      
      if (questionType === 'fill-blank') {
        isCorrect = userAnswer === correctAnswer;
      } else {
        isCorrect = userAnswer.includes(correctAnswer) || correctAnswer.includes(userAnswer);
      }
    }

    try {
      await submitLiveQuizAnswer(
        session.id!,
        user.uid,
        session.currentQuestionIndex,
        currentAnswer,
        isCorrect
      );
      
      setHasAnswered(true);
      setCurrentAnswer(null);
      setTextAnswer('');
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const handleNextQuestion = async () => {
    if (!session || !quiz || !user || session.hostUserId !== user.uid) return;

    // Auto-save current answer for this player if not already answered
    if (!hasAnswered && currentAnswer !== null) {
      const currentQuestion = quiz.questions[session.currentQuestionIndex];
      const questionType = currentQuestion.type || 'multiple-choice';
      
      let isCorrect = false;

      // Validate answer based on question type
      if (questionType === 'multiple-choice' || questionType === 'true-false') {
        const correctIdx = typeof currentQuestion.correct === 'number' 
          ? currentQuestion.correct 
          : currentQuestion.correct[0];
        isCorrect = currentAnswer === correctIdx;
      } else if (questionType === 'fill-blank' || questionType === 'short-answer') {
        const userAnswer = String(currentAnswer).trim().toLowerCase();
        const correctAnswer = currentQuestion.options[0]?.trim().toLowerCase() || '';
        
        if (questionType === 'fill-blank') {
          isCorrect = userAnswer === correctAnswer;
        } else {
          isCorrect = userAnswer.includes(correctAnswer) || correctAnswer.includes(userAnswer);
        }
      }

      try {
        await submitLiveQuizAnswer(
          session.id!,
          user.uid,
          session.currentQuestionIndex,
          currentAnswer,
          isCorrect
        );
      } catch (error) {
        console.error('Error auto-saving answer:', error);
      }
    }

    const nextIndex = session.currentQuestionIndex + 1;
    
    if (nextIndex >= quiz.questions.length) {
      // Finish quiz
      await finishLiveQuizSession(session.id!);
    } else {
      // Move to next question
      await updateLiveQuizQuestion(session.id!, nextIndex);
      setHasAnswered(false);
      setCurrentAnswer(null);
      setTextAnswer('');
    }
  };

  const handleLeaveSession = async () => {
    if (!session || !user) return;
    
    try {
      await leaveLiveQuizSession(session.id!, user.uid);
      router.push(`/classes/${session.classId}`);
    } catch (error) {
      console.error('Error leaving session:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold mb-4">Loading Live Quiz...</h1>
        </div>
      </div>
    );
  }

  if (!session || !quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-4">Session Not Found</h1>
          <Link href="/classes" className="text-blue-400 hover:underline">
            ← Back to Classes
          </Link>
        </div>
      </div>
    );
  }

  const isHost = user?.uid === session.hostUserId;
  const currentQuestion = quiz.questions[session.currentQuestionIndex];
  const currentPlayer = session.players.find(p => p.userId === user?.uid);
  const sortedPlayers = [...session.players].sort((a, b) => b.score - a.score);

  // Waiting Lobby
  if (session.status === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-6">
            <h1 className="text-4xl font-bold mb-2">🎮 Live Quiz Lobby</h1>
            <h2 className="text-2xl text-purple-200 mb-4">{quiz.title}</h2>
            <p className="text-lg mb-2">📚 Subject: {quiz.subject}</p>
            <p className="text-lg mb-2">👑 Host: {session.hostUserName}</p>
            <p className="text-lg">📝 Questions: {quiz.questions.length}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-6">
            <h3 className="text-2xl font-bold mb-4">👥 Players ({session.players.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {session.players.map((player, idx) => (
                <div 
                  key={player.userId}
                  className="bg-white/20 rounded-lg p-4 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-semibold">{player.userName}</div>
                    {player.userId === session.hostUserId && (
                      <div className="text-xs text-yellow-300">👑 Host</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={handleLeaveSession}
              className="px-6 py-3 bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Leave Lobby
            </button>
            {isHost && session.players.length > 0 && (
              <button
                onClick={handleStartQuiz}
                className="px-6 py-3 bg-green-600 rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                🚀 Start Quiz
              </button>
            )}
          </div>

          {isHost && session.players.length === 0 && (
            <div className="text-center mt-4 text-purple-200">
              ⏳ Waiting for players to join...
            </div>
          )}
        </div>
      </div>
    );
  }

  // Quiz Finished - Results
  if (session.status === 'finished') {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-3xl p-8 mb-8 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h1 className="text-4xl font-bold text-white mb-2">Quiz Complete!</h1>
            <h2 className="text-2xl text-slate-300">{quiz.title}</h2>
          </div>

          <div className="glass-card rounded-3xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-white mb-6">🏅 Final Leaderboard</h3>
            <div className="space-y-3">
              {sortedPlayers.map((player, idx) => (
                <div
                  key={player.userId}
                  className={`rounded-xl p-4 flex items-center justify-between ${
                    idx === 0
                      ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-2 border-yellow-400'
                      : idx === 1
                      ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border border-gray-400'
                      : idx === 2
                      ? 'bg-gradient-to-r from-orange-600/20 to-orange-700/20 border border-orange-400'
                      : 'bg-white/10 border border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold w-8">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{player.userName}</div>
                      <div className="text-sm text-slate-300">
                        {Math.round((player.score / quiz.questions.length) * 100)}% correct
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {player.score}/{quiz.questions.length}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Link
              href={`/classes/${session.classId}`}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold hover:scale-105 transition-all"
            >
              📚 Back to Class
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Quiz In Progress
  const questionType = currentQuestion.type || 'multiple-choice';
  const progress = ((session.currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="glass-card rounded-3xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{quiz.title}</h1>
              <p className="text-slate-300">Question {session.currentQuestionIndex + 1} of {quiz.questions.length}</p>
            </div>
            <div className="text-right">
              {quiz.timerType && quiz.timerType !== 'none' && (
                <div className="text-lg text-slate-300 mb-2">
                  ⏱️ Timer: {quiz.timerType === 'per-question' ? `${quiz.timerDuration || 60}s per question` : `${Math.floor((quiz.timerDuration || 0) / 60)} min total`}
                </div>
              )}
              <div className="text-xl font-bold text-white">
                Your Score: {currentPlayer?.score || 0}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-green-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question Section */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-3xl p-8">
              <h2 className="text-2xl font-semibold text-white mb-6">
                {currentQuestion.question}
              </h2>

              {/* Multiple Choice */}
              {(!questionType || questionType === 'multiple-choice') && (
                <div className="space-y-4">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      className={`w-full p-4 rounded-lg text-left transition-all duration-200 ${
                        currentAnswer === index
                          ? 'bg-blue-600 border-2 border-blue-400'
                          : 'bg-white/20 hover:bg-white/30 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-4 font-semibold">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="text-white">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* True/False */}
              {questionType === 'true-false' && (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleAnswerSelect(0)}
                    className={`p-6 rounded-xl text-center text-xl font-bold transition-all duration-200 ${
                      currentAnswer === 0
                        ? 'bg-green-600 border-2 border-green-400 scale-105'
                        : 'bg-white/20 hover:bg-white/30 border-2 border-transparent'
                    }`}
                  >
                    <div className="text-4xl mb-2">✓</div>
                    <div className="text-white">TRUE</div>
                  </button>
                  <button
                    onClick={() => handleAnswerSelect(1)}
                    className={`p-6 rounded-xl text-center text-xl font-bold transition-all duration-200 ${
                      currentAnswer === 1
                        ? 'bg-red-600 border-2 border-red-400 scale-105'
                        : 'bg-white/20 hover:bg-white/30 border-2 border-transparent'
                    }`}
                  >
                    <div className="text-4xl mb-2">✗</div>
                    <div className="text-white">FALSE</div>
                  </button>
                </div>
              )}

              {/* Fill in the Blank */}
              {questionType === 'fill-blank' && (
                <div>
                  <input
                    type="text"
                    value={textAnswer}
                    onChange={(e) => handleTextAnswerChange(e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full p-4 rounded-lg bg-white/20 border-2 border-white/30 focus:border-blue-400 focus:outline-none text-white placeholder-white/50 text-lg"
                  />
                </div>
              )}

              {/* Short Answer */}
              {questionType === 'short-answer' && (
                <div>
                  <textarea
                    value={textAnswer}
                    onChange={(e) => handleTextAnswerChange(e.target.value)}
                    placeholder="Write your answer here..."
                    rows={4}
                    className="w-full p-4 rounded-lg bg-white/20 border-2 border-white/30 focus:border-blue-400 focus:outline-none text-white placeholder-white/50 text-lg resize-none"
                  />
                </div>
              )}

              {/* Answer Status - No Submit Button */}
              <div className="mt-6">
                {currentAnswer !== null ? (
                  <div className="text-center p-4 bg-blue-500/20 border border-blue-400 rounded-lg text-blue-300 font-semibold">
                    ✓ Answer Selected! Waiting for host to continue...
                  </div>
                ) : (
                  <div className="text-center p-4 bg-white/10 border border-white/30 rounded-lg text-slate-300">
                    Select your answer above
                  </div>
                )}
              </div>

              {/* Host Controls */}
              {isHost && (
                <div className="mt-4">
                  <button
                    onClick={handleNextQuestion}
                    className="w-full px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors font-semibold text-white"
                  >
                    {session.currentQuestionIndex === quiz.questions.length - 1
                      ? '🏁 Finish Quiz'
                      : '➡️ Next Question'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Live Leaderboard */}
          <div className="lg:col-span-1">
            <div className="glass-card rounded-3xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">🏅 Live Leaderboard</h3>
              <div className="space-y-2">
                {sortedPlayers.map((player, idx) => (
                  <div
                    key={player.userId}
                    className={`rounded-lg p-3 flex items-center justify-between ${
                      player.userId === user?.uid
                        ? 'bg-blue-500/30 border border-blue-400'
                        : 'bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-white w-6">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white truncate max-w-[120px]">
                          {player.userName}
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-white">
                      {player.score}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
