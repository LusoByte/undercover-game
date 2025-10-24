'use client';
import React from 'react';
import type { PlayerWithRole } from '../../types.d';

export default function GuessModal({
  open,
  player,
  guess,
  feedback,
  onChangeGuess,
  onSubmit,
  onClose,
}: {
  open: boolean;
  player: PlayerWithRole | null;
  guess: string;
  feedback?: string;
  onChangeGuess: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  if (!open || !player) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-stone-900 rounded-lg p-6 w-full max-w-md mx-4 text-center text-white">
        <h3 className="text-xl font-semibold mb-2">Mr. White — make your guess</h3>
        <div className="mb-4 text-sm text-white/70">
          You have been revealed as Mr. White. If you guess the correct word the game ends and you win.
        </div>

        <input
          value={guess}
          onChange={(e) => onChangeGuess(e.target.value)}
          disabled={!!feedback}
          placeholder="Enter your guess"
          className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/20 text-white placeholder-white/60 mb-3 "
        />

        {feedback && <div className="text-sm text-yellow-300 mb-2">{feedback}</div>}

        <div className="flex gap-2 justify-center">
          <button
            onClick={onSubmit}
            disabled={!!feedback}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium"
          >
            Submit Guess
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
