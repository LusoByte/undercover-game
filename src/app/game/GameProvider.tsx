'use client';
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import usePersistSession from './hooks/usePersistenceSession';
import type { Action, GameContextValue, State, WordPair } from './types.d';

const initialState: State = { session: null, players: [], wordpool: [] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_SESSION':
      // Merge to avoid async restore overwriting in-memory updates (e.g., startedAt)
      if (action.payload === null) {
        return { ...state, session: null };
      }
      return { ...state, session: { ...(state.session || {}), ...action.payload } };
    case 'SET_PAIR':
      return { ...state, session: { ...(state.session || {}), pair: action.payload } };
    case 'SET_PLAYERS':
      return { ...state, players: action.payload };
    case 'ADD_PLAYER': {
      const p = [...state.players, action.payload];
      return { ...state, players: p };
    }
    case 'UPDATE_PLAYER': {
      const updated = state.players.map((pl, i) => (i === action.payload.index ? action.payload.player : pl));
      return { ...state, players: updated };
    }
    case 'SET_WORDPOOL':
      return { ...state, wordpool: action.payload };
    case 'RESET':
      return { ...initialState, wordpool: state.wordpool };
    default:
      return state;
  }
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const persist = usePersistSession(state.session);

  // On mount restore session if present
  useEffect(() => {
    let mounted = true;
    (async () => {
      const s = await persist.loadSession();
      if (!mounted) return;
      if (s) dispatch({ type: 'SET_SESSION', payload: s });
      if (s?.players) dispatch({ type: 'SET_PLAYERS', payload: s.players });
      if (s?.pair) dispatch({ type: 'SET_PAIR', payload: s.pair });
    })();
    return () => {
      mounted = false;
    };
  }, [persist]);

  // Load wordpool from public folder and store in state.wordpool
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/data/wordpool.json');
        if (!res.ok) throw new Error('Failed to fetch wordpool');
        const data = (await res.json()) as WordPair[];
        if (!mounted) return;
        dispatch({ type: 'SET_WORDPOOL', payload: data });
      } catch (e) {
        console.warn('Failed to load wordpool:', e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const value: GameContextValue = {
    state,
    dispatch,
    persist,
  } as GameContextValue;

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
