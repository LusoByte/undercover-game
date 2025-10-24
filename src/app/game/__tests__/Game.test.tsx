import React, { createElement, createContext, useState } from 'react';
import { vi, afterEach, describe, it, expect } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';

// -----------------------------
// Mocks (must be hoisted before importing the module under test)
// -----------------------------

// Mock Confetti component - expose a data attribute for `play`
vi.mock('../components/Confetti', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props: { play?: boolean }) =>
      React.createElement('div', {
        'data-testid': 'mock-confetti',
        'data-play': props?.play ? 'true' : 'false',
      }),
  };
});

// Mock GameBoard component
vi.mock('../components/GameBoard', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => createElement('div', { 'data-testid': 'mock-gameboard' }, 'GameBoard'),
  };
});

// Mock Lobby component
vi.mock('../components/Lobby', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => createElement('div', { 'data-testid': 'mock-lobby' }, 'Lobby'),
  };
});

// Mock GameProvider + useGame
vi.mock('../GameProvider', () => {
  const React = require('react');

  const GameStateContext = createContext<{ state: any }>({ state: {} });

  // We'll hold a ref to the setter, so tests can call __setMockGameState(...) later.
  let setStateExternal: ((s: any) => void) | null = null;

  function GameProvider({ children }: { children?: React.ReactNode }) {
    const [state, setState] = useState<any>({});
    // expose setter
    React.useEffect(() => {
      setStateExternal = setState;
      // cleanup on unmount
      return () => {
        setStateExternal = null;
      };
    }, [setState]);
    return React.createElement(GameStateContext.Provider, { value: { state } }, children);
  }

  function useGame() {
    return React.useContext(GameStateContext);
  }

  function __setMockGameState(nextState: any) {
    if (!setStateExternal) {
      // If setStateExternal isn't ready yet (provider not mounted), throw so test authors know
      throw new Error('__setMockGameState called before provider was mounted');
    }
    setStateExternal(nextState);
  }

  return {
    __esModule: true,
    GameProvider,
    useGame,
    __setMockGameState,
  };
});

// -----------------------------
// Now import the component under test
// -----------------------------
import Game from '../Game';
import * as GameProviderModule from '../GameProvider';
const { __setMockGameState } = vi.mocked(GameProviderModule) as any;

// Cleanup after each test
afterEach(() => {
  cleanup();
  // Reset provider state to empty (if provider mounted)
  try {
    __setMockGameState({}); // safe no-op if provider exists
  } catch {
    // ignore if provider not mounted
  }
});

describe('Game component (src/app/game/Game.tsx)', () => {
  it('renders Lobby when session is not started and confetti play is false', async () => {
    render(<Game />);

    // Set state: no session (or session without startedAt)
    __setMockGameState({ session: undefined });

    // Wait for Lobby to appear
    await waitFor(() => {
      expect(screen.getByTestId('mock-lobby')).toBeInTheDocument();
    });

    const confetti = screen.getByTestId('mock-confetti');
    expect(confetti).toBeInTheDocument();
    expect(confetti.getAttribute('data-play')).toBe('false');
    // GameBoard should not be present
    expect(screen.queryByTestId('mock-gameboard')).toBeNull();
  });

  it('renders GameBoard when session.startedAt is truthy and confetti play is false (no winner)', async () => {
    render(<Game />);

    // Start the session (startedAt truthy), but no winner
    __setMockGameState({ session: { startedAt: Date.now(), winner: null } });

    // Wait for GameBoard to appear
    await waitFor(() => {
      expect(screen.getByTestId('mock-gameboard')).toBeInTheDocument();
    });

    // Lobby should not be present
    expect(screen.queryByTestId('mock-lobby')).toBeNull();

    const confetti = screen.getByTestId('mock-confetti');
    expect(confetti.getAttribute('data-play')).toBe('false');
  });

  it('triggers Confetti play when winner changes from null to a value', async () => {
    render(<Game />);

    // Initialize session started but no winner
    __setMockGameState({ session: { startedAt: Date.now(), winner: null } });

    await waitFor(() => {
      expect(screen.getByTestId('mock-gameboard')).toBeInTheDocument();
    });

    // confetti should be false initially
    const confettiBefore = screen.getByTestId('mock-confetti');
    expect(confettiBefore.getAttribute('data-play')).toBe('false');

    // Now set a winner -> this should trigger the effect that sets playConfetti true
    __setMockGameState({ session: { startedAt: Date.now(), winner: 'Alice' } });

    // Wait for confetti play flag to become true
    await waitFor(() => {
      const confettiAfter = screen.getByTestId('mock-confetti');
      expect(confettiAfter.getAttribute('data-play')).toBe('true');
    });
  });

  it('resets confetti state when session becomes undefined', async () => {
    render(<Game />);

    // Start with winner set (confetti should play)
    __setMockGameState({ session: { startedAt: Date.now(), winner: 'Alice' } });

    await waitFor(() => {
      const confetti = screen.getByTestId('mock-confetti');
      expect(confetti.getAttribute('data-play')).toBe('true');
    });

    // Now reset session to undefined - InnerGame effect should reset playConfetti false
    __setMockGameState({ session: undefined });

    await waitFor(() => {
      const confetti = screen.getByTestId('mock-confetti');
      expect(confetti.getAttribute('data-play')).toBe('false');
    });
  });
});
