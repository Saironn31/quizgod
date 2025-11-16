"use client";
import React, { useState } from 'react';

interface ApiStatusBannerProps {
  className?: string;
}

const ApiStatusBanner: React.FC<ApiStatusBannerProps> = ({ className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/30 rounded-2xl p-4 backdrop-blur-sm ${className}`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl">ℹ️</div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-semibold text-blue-300">Gemini API Status</h3>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              {isExpanded ? '▲ Less' : '▼ More Info'}
            </button>
          </div>
          
          <p className="text-sm text-slate-300 mb-2">
            Using Google Gemini AI for quiz generation
          </p>

          {isExpanded && (
            <div className="mt-4 space-y-3 text-sm">
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <h4 className="font-semibold text-cyan-300 mb-2">📊 Free Tier Limits:</h4>
                <ul className="space-y-1 text-slate-300 text-xs">
                  <li>• 60 requests per minute</li>
                  <li>• 1,500 requests per day</li>
                  <li>• 32,000 tokens per request</li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <h4 className="font-semibold text-yellow-300 mb-2">⚠️ If You Hit Limits:</h4>
                <ul className="space-y-1 text-slate-300 text-xs">
                  <li>1. Wait a few minutes before retrying</li>
                  <li>2. Generate fewer questions at once</li>
                  <li>3. Use shorter documents (under 5 pages)</li>
                  <li>4. Get a new API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Google AI Studio</a></li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <h4 className="font-semibold text-green-300 mb-2">💡 Tips for Better Results:</h4>
                <ul className="space-y-1 text-slate-300 text-xs">
                  <li>• Upload clear, well-formatted documents</li>
                  <li>• Start with 5-10 questions, not 50</li>
                  <li>• Review and edit generated questions</li>
                  <li>• Save your work frequently</li>
                </ul>
              </div>

              <div className="flex gap-2 mt-4">
                <a
                  href="https://ai.google.dev/pricing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  📈 Upgrade Plans
                </a>
                <a
                  href="https://ai.google.dev/gemini-api/docs/quota"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  📚 API Docs
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiStatusBanner;
