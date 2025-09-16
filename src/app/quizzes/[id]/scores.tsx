"use client";
import React, { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import { useAuth } from "@/contexts/AuthContext";
import { useParams } from "next/navigation";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { getQuizById } from "@/lib/firestore";
import { db } from "@/lib/firebase";

export default function QuizScoresPage() {
  const { user } = useAuth();
  const params = useParams();
  const quizId = params.id as string;
  const [records, setRecords] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [quizInfo, setQuizInfo] = useState<{ title: string; subject: string } | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      if (!quizId) return;
      setLoading(true);
      try {
        const q = query(
          collection(db, "quizRecords"),
          where("quizId", "==", quizId),
          orderBy("timestamp", "desc")
        );
        const snap = await getDocs(q);
        setRecords(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        // Fetch quiz info
        const quiz = await getQuizById(quizId);
        if (quiz) setQuizInfo({ title: quiz.title, subject: quiz.subject });
      } catch (err) {
        console.error("Failed to fetch quiz records:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [quizId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
  <div className="sticky top-0 z-40"><NavBar /></div>
        <div className="max-w-3xl mx-auto mt-12">
          <h2 className="text-2xl font-bold mb-4 text-white">👥 Class Quiz Records</h2>
          {quizInfo && (
            <div className="mb-4">
              <div className="font-semibold text-white">Quiz: {quizInfo.title}</div>
              <div className="text-purple-200 text-sm">Subject: {quizInfo.subject}</div>
            </div>
          )}
          {loading ? (
            <div className="text-purple-200">Loading records...</div>
          ) : records.length === 0 ? (
            <div className="text-purple-200">No records found for this quiz.</div>
          ) : (
            <div className="bg-white/10 rounded-xl p-4">
              <ul className="divide-y divide-purple-300">
                {records.map((record) => (
                  <li
                    key={record.id}
                    className="py-3 flex justify-between items-center cursor-pointer hover:bg-purple-900/20 rounded-lg px-2"
                    onClick={() => setSelectedRecord(record)}
                  >
                    <div>
                      <div className="font-semibold text-white">User: {record.userId}</div>
                      <div className="text-purple-200 text-sm">
                        Score: {record.score} | {new Date(record.timestamp.seconds ? record.timestamp.seconds * 1000 : record.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-purple-300">View Details →</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {/* Record Details Modal */}
        {selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 max-w-lg w-full relative">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setSelectedRecord(null)}>
                ✖
              </button>
              <h3 className="text-xl font-bold mb-2 text-purple-700 dark:text-purple-300">Quiz Record Details</h3>
              <div className="mb-2 text-gray-700 dark:text-gray-200">User ID: {selectedRecord.userId}</div>
              <div className="mb-2 text-gray-700 dark:text-gray-200">Score: {selectedRecord.score}</div>
              <div className="mb-2 text-gray-700 dark:text-gray-200">Date: {new Date(selectedRecord.timestamp.seconds ? selectedRecord.timestamp.seconds * 1000 : selectedRecord.timestamp).toLocaleString()}</div>
              <div className="mb-4">
                <div className="font-semibold mb-1">Mistakes:</div>
                {selectedRecord.mistakes.length === 0 ? (
                  <div className="text-green-500">No mistakes! 🎉</div>
                ) : (
                  <ul className="list-disc ml-6 text-red-500">
                    {selectedRecord.mistakes.map((m: any, idx: number) => (
                      <li key={idx}>
                        Q: {m.question}
                        <br />User Answer: {typeof m.selected === "number" ? String.fromCharCode(65 + m.selected) : m.selected}
                        <br />Correct: {typeof m.correct === "number" ? String.fromCharCode(65 + m.correct) : m.correct}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg" onClick={() => setSelectedRecord(null)}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
