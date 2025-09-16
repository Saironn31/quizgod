"use client";
import React, { useEffect, useState } from "react";
import { getQuizById } from "@/lib/firestore";
import NavBar from "@/components/NavBar";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import Link from "next/link";
import { db } from "@/lib/firebase";

export default function QuizRecordsPage() {
  const { user } = useAuth();
  const [quizRecords, setQuizRecords] = useState<any[]>([]);
  const [quizInfoMap, setQuizInfoMap] = useState<Record<string, { title: string; subject: string }> >({});
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [classQuizzes, setClassQuizzes] = useState<{ quizId: string; className: string }[]>([]);
  const [loadingClassQuizzes, setLoadingClassQuizzes] = useState(false);

  useEffect(() => {
    const fetchRecords = async () => {
      if (!user?.uid) return;
      setLoadingRecords(true);
      try {
        const q = query(
          collection(db, "quizRecords"),
          where("userId", "==", user.uid),
          orderBy("timestamp", "desc")
        );
        const snap = await getDocs(q);
        const records = snap.docs.map((doc) => {
          const data = doc.data();
          return { id: doc.id, quizId: data.quizId, ...data };
        });
        setQuizRecords(records);
        // Fetch quiz info for each record
        const quizIds = Array.from(new Set(records.map(r => r.quizId)));
        const infoMap: Record<string, { title: string; subject: string }> = {};
        await Promise.all(quizIds.map(async (quizId) => {
          const quiz = await getQuizById(quizId);
          if (quiz) infoMap[quizId] = { title: quiz.title, subject: quiz.subject };
        }));
        setQuizInfoMap(infoMap);
      } catch (err) {
        console.error("Failed to fetch quiz records:", err);
      } finally {
        setLoadingRecords(false);
      }
    };
    const fetchClassQuizzes = async () => {
      if (!user?.uid) return;
      setLoadingClassQuizzes(true);
      try {
        const classSnap = await getDocs(
          query(collection(db, "classes"), where("members", "array-contains", user.uid))
        );
        const quizzes: { quizId: string; className: string }[] = [];
        for (const classDoc of classSnap.docs) {
          const classData = classDoc.data();
          if (classData.quizIds && Array.isArray(classData.quizIds)) {
            for (const quizId of classData.quizIds) {
              quizzes.push({ quizId, className: classData.name });
            }
          }
        }
        setClassQuizzes(quizzes);
      } catch (err) {
        console.error("Failed to fetch class quizzes:", err);
      } finally {
        setLoadingClassQuizzes(false);
      }
    };
    if (user?.uid) {
      fetchRecords();
      fetchClassQuizzes();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
  <div className="sticky top-0 z-40"><NavBar /></div>
        <div className="max-w-3xl mx-auto mt-12">
          <h2 className="text-2xl font-bold mb-4 text-white">📊 Your Quiz Records</h2>
          {loadingRecords ? (
            <div className="text-purple-200">Loading records...</div>
          ) : quizRecords.length === 0 ? (
            <div className="text-purple-200">No quiz records found. Play a quiz to see your results here!</div>
          ) : (
            <div className="bg-white/10 rounded-xl p-4">
              <ul className="divide-y divide-purple-300">
                {quizRecords.map((record) => (
                  <li
                    key={record.id}
                    className="py-3 flex justify-between items-center cursor-pointer hover:bg-purple-900/20 rounded-lg px-2"
                    onClick={() => setSelectedRecord(record)}
                  >
                    <div>
                      <div className="font-semibold text-white">
                        Quiz: {quizInfoMap[record.quizId]?.title || record.quizId}
                      </div>
                      <div className="text-purple-200 text-sm">
                        Subject: {quizInfoMap[record.quizId]?.subject || "Unknown"}
                      </div>
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
          <div className="fixed inset-0 bg-black bg-opacity-70 z-50 w-screen h-screen overflow-auto">
            <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 rounded-none shadow-none p-8 w-full h-full relative border-none max-h-screen overflow-y-auto flex flex-col">
              <div className="absolute left-0 top-0 w-full"><NavBar /></div>
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-200 text-2xl" onClick={() => setSelectedRecord(null)}>
                ✖
              </button>
              <h3 className="text-2xl font-extrabold mb-4 text-purple-200">Quiz Record Details</h3>
              <div className="mb-2 text-white font-bold text-lg">Quiz: {quizInfoMap[selectedRecord.quizId]?.title || selectedRecord.quizId}</div>
              <div className="mb-2 text-purple-200">Subject: {quizInfoMap[selectedRecord.quizId]?.subject || "Unknown"}</div>
              <div className="mb-2 text-purple-100">Score: <span className="font-bold text-green-400">{selectedRecord.score}</span></div>
              <div className="mb-2 text-purple-100">Date: {new Date(selectedRecord.timestamp.seconds ? selectedRecord.timestamp.seconds * 1000 : selectedRecord.timestamp).toLocaleString()}</div>
              <div className="mb-6">
                <div className="font-semibold mb-2 text-purple-300">Mistakes:</div>
                {selectedRecord.mistakes.length === 0 ? (
                  <div className="text-green-400 font-bold">No mistakes! 🎉</div>
                ) : (
                  <div className="space-y-4">
                    {selectedRecord.mistakes.map((m: any, idx: number) => (
                      <div key={idx} className="bg-white/10 rounded-lg p-4 border border-purple-800">
                        <div className="font-semibold text-white mb-2">Q{idx + 1}: {m.question}</div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-6">
                          <div className="text-purple-200">Your Answer: <span className="font-bold text-red-400">{typeof m.selected === "number" ? String.fromCharCode(65 + m.selected) : (m.selected === "@" ? "No answer" : m.selected)}</span></div>
                          <div className="text-green-300">Correct: <span className="font-bold">{typeof m.correct === "number" ? String.fromCharCode(65 + m.correct) : m.correct}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button className="mt-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow hover:bg-purple-700/80 transition-all text-lg" onClick={() => setSelectedRecord(null)}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

