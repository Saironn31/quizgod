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
        <div className="text-2xl">🤖</div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-semibold text-blue-300">DeepSeek R1 via OpenRouter</h3>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              {isExpanded ? '▲ Less' : '▼ More Info'}
            </button>
          </div>
          
          <p className="text-sm text-slate-300 mb-2">
            Using DeepSeek R1 (Free) - Advanced reasoning AI model
          </p>

          {isExpanded && (
            <div className="mt-4 space-y-3 text-sm">
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <h4 className="font-semibold text-cyan-300 mb-2">📊 Free Tier Info:</h4>
                <ul className="space-y-1 text-slate-300 text-xs">
                  <li>• Model: DeepSeek R1 (Free)</li>
                  <li>• Rate limits enforced per key</li>
                  <li>• No daily request cap (fair use)</li>
                  <li>• Up to 4,000 tokens per response</li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <h4 className="font-semibold text-yellow-300 mb-2">⚠️ If You Hit Limits:</h4>
                <ul className="space-y-1 text-slate-300 text-xs">
                  <li>1. Wait 1-2 minutes before retrying</li>
                  <li>2. Generate fewer questions at once</li>
                  <li>3. Use shorter documents (under 10 pages)</li>
                  <li>4. Get an API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">OpenRouter</a></li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <h4 className="font-semibold text-green-300 mb-2">💡 Tips for Better Results:</h4>
                <ul className="space-y-1 text-slate-300 text-xs">
                  <li>• Upload clear, well-formatted documents</li>
                  <li>• Start with 5-10 questions, not 50</li>
                  <li>• DeepSeek R1 excels at reasoning tasks</li>
                  <li>• Review and edit generated questions</li>
                  <li>• Save your work frequently</li>
                </ul>
              </div>

              <div className="flex gap-2 mt-4">
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  � Get API Key
                </a>
                <a
                  href="https://openrouter.ai/docs"
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
