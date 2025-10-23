'use client';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useGame } from '../GameProvider';
import type { PlayerWithRole, WordPair } from '../types.d';
import WelcomeModal from './modals/WelcomeModal';
import { calculateRequiredRoles } from '../utils/calculateRequiredRoles';

export default function Lobby() {
  const { state, dispatch } = useGame();
  const [nameInput, setNameInput] = useState('');
  const [welcomeOpen, setWelcomeOpen] = useState(state.session === null);
  const [playerCount, setPlayerCount] = useState<number | null>(null);
  const [selectedPair, setSelectedPair] = useState<WordPair | null>(null);

  const players = state.session?.players ?? [];

  // Initialize a local pair once the wordpool is available, before session exists
  useEffect(() => {
    if (!state.session?.pair && !selectedPair && state.wordpool.length > 0) {
      const random = state.wordpool[Math.floor(Math.random() * state.wordpool.length)];
      setSelectedPair(random);
    }
  }, [state.session?.pair, selectedPair, state.wordpool]);

  // Use the session pair if present, otherwise fall back to the locally selected pair
  const pair = useMemo(() => {
    return state.session?.pair ?? selectedPair;
  }, [state.session?.pair, selectedPair]);

  const addPlayer = useCallback(() => {
    if (!nameInput.trim() || !playerCount) return;
    if (!pair) {
      alert('Word pair not ready yet. Please wait a moment.');
      return;
    }

    // determine roles
    const rolesReq = calculateRequiredRoles(playerCount);
    const currentRoles = {
      civilian: players.filter((p) => p.role === 'civilian').length,
      undercover: players.filter((p) => p.role === 'undercover').length,
      mrwhite: players.filter((p) => p.role === 'mrwhite').length,
    };

    // Create weighted role assignment for better distribution
    const roleWeights: Array<{ role: 'civilian' | 'undercover' | 'mrwhite'; weight: number }> = [];

    // Calculate weights based on how many more roles are needed
    const remainingMrWhite = rolesReq.mrwhite - currentRoles.mrwhite;
    const remainingUndercover = rolesReq.undercover - currentRoles.undercover;
    const remainingCivilian = rolesReq.civilian - currentRoles.civilian;

    // Add roles with weights proportional to how many are still needed
    // Mr. White cannot be assigned to the first player
    if (remainingMrWhite > 0 && players.length > 0) {
      roleWeights.push({ role: 'mrwhite', weight: remainingMrWhite });
    }
    if (remainingUndercover > 0) {
      roleWeights.push({ role: 'undercover', weight: remainingUndercover });
    }
    if (remainingCivilian > 0) {
      roleWeights.push({ role: 'civilian', weight: remainingCivilian });
    }

    // Weighted random selection
    const totalWeight = roleWeights.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    let selectedRole: 'civilian' | 'undercover' | 'mrwhite' = 'civilian';
    for (const item of roleWeights) {
      random -= item.weight;
      if (random <= 0) {
        selectedRole = item.role;
        break;
      }
    }

    const word = selectedRole === 'undercover' ? pair.undercover : selectedRole === 'civilian' ? pair.civilian : null;

    const newPlayer: PlayerWithRole = {
      id: Math.random(),
      name: nameInput.trim(),
      revealed: false,
      role: selectedRole,
      word,
    };

    dispatch({ type: 'ADD_PLAYER', payload: newPlayer });
    setNameInput('');
  }, [nameInput, playerCount, dispatch, players, pair]);

  const startGame = useCallback(() => {
    if (!playerCount) return;
    if (players.length < 4) return alert('Need at least 4 players');
    if (!pair) {
      // Try to select now if possible
      if (state.wordpool.length > 0) {
        const random = state.wordpool[Math.floor(Math.random() * state.wordpool.length)];
        setSelectedPair(random);
      } else {
        alert('Word pair not loaded yet. Please wait.');
        return;
      }
    }

    const session = {
      ...(state.session || {}),
      startedAt: new Date().toISOString(),
      pair: pair ?? selectedPair,
    };

    dispatch({ type: 'SET_SESSION', payload: session });
  }, [playerCount, players, dispatch, state.session, pair, state.wordpool, selectedPair]);

  const rolesSummary = useMemo(() => (playerCount ? calculateRequiredRoles(playerCount) : null), [playerCount]);

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
      <WelcomeModal
        open={welcomeOpen}
        onSelect={(n) => {
          setPlayerCount(n);
          setWelcomeOpen(false);
          // Eagerly select a pair when player count is chosen if not already set
          if (!state.session?.pair && !selectedPair && state.wordpool.length > 0) {
            const rnd = state.wordpool[Math.floor(Math.random() * state.wordpool.length)];
            setSelectedPair(rnd);
          }
        }}
      />

      {playerCount && (
        <>
          <h2 className="text-2xl font-semibold mb-4">Add Players</h2>
          <div className="flex gap-2 mb-4">
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Player name"
              className="flex-1 px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/60"
            />
            <button
              onClick={addPlayer}
              disabled={!playerCount || !pair || players.length >= (playerCount || 0)}
              className="px-6 py-2 bg-blue-600 rounded-lg"
            >
              Add
            </button>
          </div>
          <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
            <div>
              Total Players: <span className="font-semibold">{playerCount}</span>
            </div>
            {rolesSummary && (
              <div className="mt-1">
                <span className="text-red-400">{rolesSummary.undercover} Undercover</span> •{' '}
                <span className="text-yellow-400"> {rolesSummary.mrwhite} Mr. White</span> •{' '}
                <span className="text-green-400"> {rolesSummary.civilian} Civilians</span>
              </div>
            )}
            <button
              onClick={() => {
                setPlayerCount(null);
                setWelcomeOpen(true);
              }}
              className="mt-3 px-3 py-1 text-xs bg-blue-600 rounded"
            >
              Change Player Count
            </button>
          </div>
        </>
      )}

      {players.length > 0 && (
        <div className="mt-4">
          <h3 className="font-medium">Players ({players.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
            {players.map((p) => (
              <div key={p.id} className="bg-white/10 rounded-lg p-3 text-center">
                {p.name}
              </div>
            ))}
          </div>

          <button
            onClick={startGame}
            disabled={players.length < (playerCount || 4)}
            className="w-full mt-4 py-3 bg-green-600 hover:bg-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
          >
            Start Game ({players.length}/{playerCount || 4})
          </button>
        </div>
      )}
    </div>
  );
}
