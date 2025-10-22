'use client';
import React from 'react';
import type { PlayerWithRole } from '../../types.d';

export default function RevealModal({
  player,
  open,
  onClose,
}: {
  player: PlayerWithRole | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!open || !player) return null;
  function titleCaseRole(r: string | null | undefined) {
    if (!r) return '';
    if (r.toLowerCase() === 'mrwhite') return 'Mr. White';
    return r.charAt(0).toUpperCase() + r.slice(1);
  }

  return (
    <div className="fixed m-0 inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-stone-900 rounded-lg p-6 w-full max-w-md mx-4 text-center text-white">
        <h3 className="text-xl font-semibold mb-2">Hello, {player.name}!</h3>
        <div className="mb-4 text-sm text-white/70">This is your private role reveal.</div>

        <div
          className="inline-block px-4 py-2 rounded-full mb-4 text-sm font-medium"
          style={{
            background:
              player.role === 'undercover'
                ? 'rgba(220,38,38,0.2)'
                : player.role === 'mrwhite'
                  ? 'rgba(234,179,8,0.15)'
                  : 'rgba(34,197,94,0.15)',
          }}
        >
          {titleCaseRole(player.role)}
        </div>

        {player.role === 'mrwhite' ? (
          <div className="text-sm italic mb-4">
            You are <strong>Mr. White</strong>.
          </div>
        ) : (
          <div className="text-lg font-bold mb-4">Your word: `&quot;`{player.word}`&quot;`</div>
        )}

        <button onClick={onClose} className="mt-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">
          Got it
        </button>
      </div>
    </div>
  );
}
