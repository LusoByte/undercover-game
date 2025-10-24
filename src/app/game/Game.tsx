'use client';
import React, { useEffect, useRef, useState } from 'react';
import Confetti from './components/Confetti';
import GameBoard from './components/GameBoard';
import Lobby from './components/Lobby';
import { GameProvider } from './GameProvider';
import { useGame } from './GameProvider';

function InnerGame() {
  const { state } = useGame();
  const isStarted = !!state.session?.startedAt;
  const [playConfetti, setPlayConfetti] = useState(false);
  const previousWinnerRef = useRef<string | null>(null);

  // Track when a winner is newly set to trigger confetti
  useEffect(() => {
    const currentWinner = state.session?.winner;
    const previousWinner = previousWinnerRef.current;

    // If winner changed from null/undefined to a value, trigger confetti
    if (currentWinner && !previousWinner) {
      setPlayConfetti(true);
    }

    previousWinnerRef.current = currentWinner || null;
  }, [state.session?.winner]);

  // Reset confetti state when game is reset
  useEffect(() => {
    if (!state.session) {
      setPlayConfetti(false);
      previousWinnerRef.current = null;
    }
  }, [state.session]);

  return (
    <div className="">
      {!isStarted ? <Lobby /> : <GameBoard />}
      <Confetti key="confetti" play={playConfetti} />
    </div>
  );
}

export default function Game() {
  return (
    <GameProvider>
      <InnerGame />
    </GameProvider>
  );
}
