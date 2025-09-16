"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import AuthModal from "@/components/AuthModal";
import NavBar from "@/components/NavBar";
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function HomePage() {
  const [showAuth, setShowAuth] = useState(false);
  const { user } = useAuth();
  const [quizRecords, setQuizRecords] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [loadingRecords, setLoadingRecords] = useState(false);

  useEffect(() => {
    const fetchRecords = async () => {
      if (!user?.uid) return;
      setLoadingRecords(true);
      try {
        const q = query(
          collection(db, 'quizRecords'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc')
        );
        const snap = await getDocs(q);
        setQuizRecords(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error('Failed to fetch quiz records:', err);
      } finally {
        setLoadingRecords(false);
      }
    };
    if (user?.uid) fetchRecords();
  }, [user]);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 text-white">
        {/* ...rest of the JSX... */}
      </div>
    </>
  );

