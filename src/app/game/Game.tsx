'use client';
import React from 'react';
import GameBoard from './components/GameBoard';
import Lobby from './components/Lobby';
import { GameProvider } from './GameProvider';
import { useGame } from './GameProvider';

function InnerGame() {
  const { state } = useGame();
  const isStarted = !!state.session?.startedAt;

  return <div className="">{!isStarted ? <Lobby /> : <GameBoard />}</div>;
}

export default function Game() {
  return (
    <GameProvider>
      <InnerGame />
    </GameProvider>
  );
}
