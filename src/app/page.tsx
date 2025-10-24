import React from 'react';
import Game from './game/Game';

export default function Home() {
  return (
    <div
      className="flex items-center justify-center h-screen
        bg-gradient-to-br
        from-blue-900
        via-purple-900
        to-indigo-900
        text-white
        p-4"
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">Undercover</h1>
        <h4 className="text-md text-center mb-8">
          Welcome to lobby. Please add the number of players and their names to play
        </h4>
        <Game />
      </div>
    </div>
  );
}
