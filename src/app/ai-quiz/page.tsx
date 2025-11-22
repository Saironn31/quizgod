"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AIQuizRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.push("/quiz-creator");
  }, [router]);
  
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <p className="text-white text-xl">Redirecting to Quiz Creator...</p>
      </div>
    </div>
  );
}
