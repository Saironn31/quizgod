"use client";
import Link from 'next/link';
import React from 'react';

export default function ScoresButton({ href, children }: { href: string; children?: React.ReactNode }) {
  return (
    <Link href={href} className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-sm inline-flex items-center gap-2">
      {children || '🏆 Scores'}
    </Link>
  );
}
