import { Roles } from '../enums';
import { PlayerRolesRevealed, WordPairRevealed } from '../types';

export function checkGameEnd(players: PlayerRolesRevealed[], pair: WordPairRevealed) {
  if (!pair) return null;

  const undercoverAlive = players.some((p) => p.role === Roles.Undercover && !p.revealed);
  const civilianAlive = players.some((p) => p.role === Roles.Civilian && !p.revealed);
  const mrwhiteAlive = players.some((p) => p.role === Roles.MrWhite && !p.revealed);

  // If no undercovers and no mrwhite remain -> civilians win
  if (!undercoverAlive && !mrwhiteAlive && civilianAlive) return Roles.Civilian;

  // If only Mr. White remains
  if (!civilianAlive && !undercoverAlive && mrwhiteAlive) return Roles.MrWhite;

  // If no civilians remain but at least one undercover remains -> undercover wins
  if (!civilianAlive && !mrwhiteAlive) return Roles.Undercover;

  return null;
}
