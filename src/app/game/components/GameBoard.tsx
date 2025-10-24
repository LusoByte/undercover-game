'use client';
import React, { useCallback, useState } from 'react';
import { Roles } from '../enums';
import { useGame } from '../GameProvider';
import type { PlayerWithRole } from '../types.d';
import GuessModal from './modals/GuessModal';
import PlayerCard from './PlayerCard';
import { checkGameEnd } from '../utils/checkGameEnd';

export default function GameBoard() {
  const { state, dispatch, persist } = useGame();
  const [guessModal, setGuessModal] = useState<{
    open: boolean;
    playerIndex: number | null;
    guess: string;
    feedback?: string;
  }>({
    open: false,
    playerIndex: null,
    guess: '',
    feedback: undefined,
  });

  const players = state.session?.players ?? [];
  const pair = state.session?.pair ?? null;

  const reveal = useCallback(
    (index: number) => {
      const playersUpdated: PlayerWithRole[] = players.map((p, i) => (i === index ? { ...p, revealed: true } : p));

      const revealedPlayer = playersUpdated[index];

      // If Mr. White is revealed, open guess modal
      if (revealedPlayer.role === Roles.MrWhite) {
        dispatch({
          type: 'SET_SESSION',
          payload: {
            ...(state.session || {}),
            players: playersUpdated,
            revealedCount: playersUpdated.filter((p) => p.revealed).length,
          },
        });
        setGuessModal({ open: true, playerIndex: index, guess: '', feedback: undefined });
        return;
      }

      const winner = checkGameEnd(playersUpdated, pair);
      if (winner) {
        dispatch({
          type: 'SET_SESSION',
          payload: {
            ...(state.session || {}),
            players: playersUpdated,
            winner,
          },
        });
      } else {
        // update session players & revealedCount
        dispatch({
          type: 'SET_SESSION',
          payload: {
            ...(state.session || {}),
            players: playersUpdated,
            revealedCount: playersUpdated.filter((p) => p.revealed).length,
          },
        });
      }
    },
    [dispatch, players, state.session, pair]
  );

  const submitMrWhiteGuess = useCallback(() => {
    if (guessModal.playerIndex === null) return;
    const guess = guessModal.guess.trim().toLowerCase();
    const civilian = pair?.civilian?.trim().toLowerCase();

    if (guess && guess === civilian) {
      // Mr. White guessed correctly → Mr. White wins immediately
      const playersRevealed = players.map((p) => ({ ...p, revealed: true }));
      dispatch({
        type: 'SET_SESSION',
        payload: {
          ...(state.session || {}),
          players: playersRevealed,
          winner: Roles.MrWhite,
          endedAt: new Date().toISOString(),
        },
      });

      setGuessModal({ open: false, playerIndex: null, guess: '', feedback: undefined });
      return;
    }

    // Incorrect guess: reveal Mr. White and continue
    setGuessModal((g) => ({ ...g, feedback: 'Incorrect guess — game continues.' }));

    const idx = guessModal.playerIndex;
    if (idx !== null) {
      const updatedPlayers = players.map((p, i) => (i === idx ? { ...p, revealed: true } : p));
      const winnerAfter = checkGameEnd(updatedPlayers, pair);
      if (winnerAfter) {
        dispatch({
          type: 'SET_SESSION',
          payload: { ...(state.session || {}), players: updatedPlayers, winner: winnerAfter },
        });
      } else {
        dispatch({
          type: 'SET_SESSION',
          payload: {
            ...(state.session || {}),
            players: updatedPlayers,
            revealedCount: updatedPlayers.filter((p) => p.revealed).length,
          },
        });
      }
    }
  }, [guessModal, players, pair, dispatch, state.session]);

  const closeGuessModal = useCallback(() => {
    setGuessModal({ open: false, playerIndex: null, guess: '', feedback: undefined });
  }, []);

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Game in Progress</h2>
        <button
          onClick={async () => {
            // Clear persisted session first, then reset in-memory state
            try {
              await persist?.clearSession();
            } catch {}
            dispatch({ type: 'RESET' });
          }}
          className="px-4 py-2 bg-red-600 rounded-lg"
        >
          Reset Game
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {players.map((p, i) => (
          <PlayerCard key={p.id} player={p} index={i} onReveal={reveal} />
        ))}
      </div>

      {state.session?.winner && (
        <div className="mt-6 text-center">
          <div className="text-2xl font-bold mb-2">
            {state.session.winner === Roles.MrWhite ? 'The Mr. White player won!' : 'Game Complete!'}
          </div>
          {state.session.winner === Roles.Undercover && <div className="text-lg">The undercover player won!</div>}
          {state.session.winner === Roles.Civilian && <div className="text-lg">The civilians won!</div>}
        </div>
      )}

      <GuessModal
        open={guessModal.open}
        player={guessModal.playerIndex !== null ? players[guessModal.playerIndex] : null}
        guess={guessModal.guess}
        feedback={guessModal.feedback}
        onChangeGuess={(v) => setGuessModal((g) => ({ ...g, guess: v }))}
        onSubmit={submitMrWhiteGuess}
        onClose={closeGuessModal}
      />
    </div>
  );
}
