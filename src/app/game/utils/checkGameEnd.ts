import { PlayerRolesRevealed, WordPairRevealed } from '../types';

export function checkGameEnd(players: PlayerRolesRevealed[], pair: WordPairRevealed) {
  if (!pair) return null;

  const undercoverAlive = players.some((p) => p.role === 'undercover' && !p.revealed);
  const civilianAlive = players.some((p) => p.role === 'civilian' && !p.revealed);
  const mrwhiteAlive = players.some((p) => p.role === 'mrwhite' && !p.revealed);

  // If no undercovers and no mrwhite remain -> civilians win
  if (!undercoverAlive && !mrwhiteAlive && civilianAlive) return 'civilian';

  // If only Mr. White remains
  if (!civilianAlive && !undercoverAlive && mrwhiteAlive) return 'mrwhite';

  // If no civilians remain but at least one undercover remains -> undercover wins
  if (!civilianAlive && !mrwhiteAlive) return 'undercover';

  return null;
}
