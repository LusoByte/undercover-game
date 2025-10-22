'use client';
import { openDB } from 'idb';
import { useEffect, useRef } from 'react';
import type { GameSession } from '../types';

const DB_NAME = 'undercover-db';
const STORE = 'sessions';
const SESSION_KEY = 'current_session_v1';

async function getDB() {
  return openDB(DB_NAME, 1, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    upgrade(db: any) {
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    },
  });
}

export default function usePersistSession(session: GameSession | null) {
  // debounce writes: avoid excessive writes when many state updates happen quickly
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!session) return;

    // simple debounce (200ms)
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);

    timeoutRef.current = window.setTimeout(async () => {
      try {
        const db = await getDB();
        await db.put(STORE, session, SESSION_KEY);
      } catch (e) {
        console.warn('Failed to persist session:', e);
      }
    }, 200);

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [session]);

  // also expose a loader/clearer for initial restore or reset
  async function loadSession(): Promise<GameSession | null> {
    try {
      const db = await getDB();
      const s = await db.get(STORE, SESSION_KEY);
      return s || null;
    } catch (e) {
      console.warn('Failed to load session:', e);
      return null;
    }
  }

  async function clearSession() {
    try {
      const db = await getDB();
      await db.delete(STORE, SESSION_KEY);
    } catch (e) {
      console.warn('Failed to clear session:', e);
    }
  }

  return { loadSession, clearSession };
}
