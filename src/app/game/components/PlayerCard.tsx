'use client';
import React from 'react';
import { Roles } from '../enums';
import type { PlayerWithRole } from '../types.d';

export default function PlayerCard({
  player,
  index,
  onReveal,
}: {
  player: PlayerWithRole;
  index: number;
  onReveal: (i: number) => void;
}) {
  return (
    <div
      className={`bg-white/10 rounded-lg p-4 text-center cursor-pointer transition-all hover:scale-105 ${player.revealed ? 'ring-2 ring-green-400 bg-green-900/20' : 'hover:bg-white/20'}`}
      onClick={() => !player.revealed && onReveal(index)}
    >
      <div className="font-medium text-lg mb-2">{player.name}</div>
      {player.revealed ? (
        <div className="space-y-2">
          <div
            className={`text-sm px-2 py-1 rounded-full ${player.role === Roles.Undercover ? 'bg-red-600' : player.role === Roles.MrWhite ? 'bg-yellow-600' : 'bg-green-600'}`}
          >
            {player.role === Roles.Undercover ? 'Undercover' : player.role === Roles.MrWhite ? 'Mr. White' : 'Civilian'}
          </div>
        </div>
      ) : (
        <div className="text-white/60">Click to reveal</div>
      )}
    </div>
  );
}
