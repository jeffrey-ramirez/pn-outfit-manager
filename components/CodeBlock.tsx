
import React, { useState } from 'react';

interface CodeBlockProps {
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  return (
    <div className="relative group rounded-xl bg-slate-950 border border-slate-800 shadow-2xl flex flex-col">
      {/* Sticky Header with Copy Button */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
            <div className="w-2 h-2 rounded-full bg-amber-500/50"></div>
            <div className="w-2 h-2 rounded-full bg-emerald-500/50"></div>
          </div>
          <span className="ml-2 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">C# Outfit Fragment</span>
        </div>
        <button
          onClick={handleCopy}
          className={`px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all duration-200 border ${
            copied 
            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' 
            : 'bg-indigo-600 border-indigo-500 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20'
          }`}
        >
          {copied ? (
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Copied
            </span>
          ) : 'Copy Code'}
        </button>
      </div>
      
      {/* Code Area */}
      <pre className="p-6 overflow-x-auto text-sm font-mono text-indigo-300 leading-relaxed scrollbar-hide">
        <code className="block min-w-full">{code}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
