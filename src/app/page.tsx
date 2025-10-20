import React from 'react';
import Game from '../components/Game';

export default function Home() {
  return (
    <div
      className="min-h-screen
        bg-gradient-to-br
        from-blue-900
        via-purple-900
        to-indigo-900
        text-white
        p-4"
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Undercover</h1>
        <Game />
      </div>
    </div>
  );
}
