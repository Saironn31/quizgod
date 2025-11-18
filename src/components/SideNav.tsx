'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { isUserAdmin } from '@/lib/firestore';

export default function SideNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, userProfile } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (user?.uid) {
        const adminStatus = await isUserAdmin(user.uid);
        setIsAdmin(adminStatus);
      }
    };
    checkAdmin();
  }, [user]);

  const navItems = [
    { href: '/', label: 'Home', icon: '◈', gradient: 'from-cyan-400 to-blue-500' },
    { href: '/quizzes', label: 'Quizzes', icon: '◉', gradient: 'from-violet-400 to-purple-500' },
    { href: '/quiz-creator', label: 'Create Quiz', icon: '⊕', gradient: 'from-emerald-400 to-green-500' },
    { href: '/classes', label: 'Classes', icon: '◐', gradient: 'from-orange-400 to-amber-500' },
    { href: '/subjects', label: 'Subjects', icon: '◫', gradient: 'from-indigo-400 to-blue-500' },
    { href: '/analytics', label: 'Stats', icon: '◭', gradient: 'from-teal-400 to-cyan-500' },
    { href: '/friends', label: 'Friends', icon: '◎', gradient: 'from-fuchsia-400 to-purple-500' },
    { href: '/profile', label: 'Profile', icon: '◕', gradient: 'from-lime-400 to-green-500' },
  ];

  if (!user) return null;

  return (
    <>
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-screen bg-slate-900/95 backdrop-blur-xl border-r border-white/10 z-50 w-64 hidden md:flex flex-col animate-slide-right">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-white/10 animate-fade-in-down">
          <div className="w-full flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center font-black text-white animate-pulse">
              Q
            </div>
            <span className="text-xl font-black gradient-text">QuizGod</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-3 overflow-y-auto">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 animate-fade-in-left stagger-item hover-lift ${
                  isActive
                    ? 'bg-white/10 shadow-glow'
                    : 'hover:bg-white/5 hover:translate-x-1'
                }`}
              >
                {/* Icon */}
                <div className={`rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white font-bold transition-transform w-10 h-10 text-2xl group-hover:rotate-12`}>
                  {item.icon}
                </div>
                
                {/* Label */}
                <span className={`font-semibold text-base transition-colors ${
                  isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                }`}>
                  {item.label}
                </span>

                {/* Active Indicator */}
                {isActive && (
                  <div className={`absolute right-0 w-1 h-10 rounded-l-full bg-gradient-to-b ${item.gradient}`}></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={async () => {
              await logout();
              router.push('/');
            }}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all duration-300 group hover-lift active:scale-95"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold text-xl">
              ⊗
            </div>
            <span className="font-semibold">Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Nav - Desktop-style vertical layout */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 z-50 md:hidden pb-safe animate-slide-up">
        {/* Logo/Brand on mobile */}
        <div className="px-4 pt-3 pb-2 border-b border-white/10 flex items-center justify-center gap-3 animate-fade-in">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center font-black text-white text-sm animate-pulse">
            Q
          </div>
          <span className="text-lg font-black gradient-text">QuizGod</span>
        </div>

        {/* Scrollable Navigation */}
        <div className="overflow-x-auto overflow-y-hidden">
          <div className="flex gap-2 p-3 min-w-max">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-2 px-4 py-2 rounded-xl min-w-[80px] transition-all duration-300 hover-grow active:scale-95 ${
                    isActive
                      ? 'bg-white/10 shadow-glow'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white font-bold text-xl transition-transform ${
                    isActive ? '' : 'scale-90'
                  }`}>
                    {item.icon}
                  </div>
                  <span className={`text-xs font-semibold text-center ${
                    isActive ? 'text-white' : 'text-slate-300'
                  }`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
            
            {/* Logout button */}
            <button
              onClick={async () => {
                await logout();
                router.push('/');
              }}
              className="flex flex-col items-center gap-2 px-4 py-2 rounded-xl min-w-[80px] bg-red-500/10 hover:bg-red-500/20 transition-all duration-300 hover-grow active:scale-95"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold text-xl scale-90">
                ⊗
              </div>
              <span className="text-xs font-semibold text-red-400 text-center">
                Logout
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
