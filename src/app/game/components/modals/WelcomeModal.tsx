'use client';
import React from 'react';

export default function WelcomeModal({ open, onSelect }: { open: boolean; onSelect: (n: number) => void }) {
  if (!open) return null;
  const options = [4, 5, 6, 7, 8, 9, 10, 11, 12];

  return (
    <div className="bg-stone-900 rounded-lg p-8 w-full max-w-full text-center text-white">
      <h1 className="text-3xl font-bold mb-6 text-blue-400">Welcome to Undercover!</h1>
      <p className="text-lg mb-8 text-white/80">Choose how many players will be in this session</p>
      <div className="grid grid-cols-3 gap-6 mb-6">
        {options.map((count) => (
          <button
            key={count}
            onClick={() => onSelect(count)}
            className="p-4 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all hover:scale-105"
          >
            <div className="text-xl font-bold mb-1">{count}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
