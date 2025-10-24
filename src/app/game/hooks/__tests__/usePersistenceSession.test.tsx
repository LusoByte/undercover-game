// src/app/game/hooks/usePersistenceSession.test.ts
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

// ---- Mock idb.openDB ----
// We'll create spies for put/get/delete and have openDB return them.
const mockPut = vi.fn();
const mockGet = vi.fn();
const mockDelete = vi.fn();

// Provide a mock openDB implementation
vi.mock('idb', () => {
  return {
    __esModule: true,
    openDB: vi.fn(async () => {
      // Return an object with put/get/delete methods used by the hook
      return {
        put: mockPut,
        get: mockGet,
        delete: mockDelete,
      };
    }),
  };
});

import usePersistSession from '../usePersistenceSession';

// A small harness component that calls the hook and exposes returned helpers on window
function HookHarness({ session }: { session: any | null }) {
  // call the hook and attach returned helpers to window for test access
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const helpers = usePersistSession(session);
  // expose on window for tests
  // @ts-ignore
  (window as any).__persistHelpers = helpers;
  return null;
}

describe('usePersistSession', () => {
  const realSetTimeout = window.setTimeout;
  const realClearTimeout = window.clearTimeout;

  beforeEach(() => {
    vi.useFakeTimers();
    // reset mocks
    mockPut.mockReset();
    mockGet.mockReset();
    mockDelete.mockReset();
    // clear any leftover helpers
    // @ts-ignore
    delete (window as any).__persistHelpers;
    // Silence console.warn from the hook implementation during tests if any
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    // restore console.warn
    (console.warn as any).mockRestore?.();
    // restore global timers just in case
    window.setTimeout = realSetTimeout;
    window.clearTimeout = realClearTimeout;
    // cleanup window helper
    // @ts-ignore
    delete (window as any).__persistHelpers;
    vi.restoreAllMocks();
  });

  it('schedules a put to the DB after debounce when session is provided', async () => {
    const sessionObj = { id: 's1', players: [] };

    // Render harness with a non-null session to trigger effect
    render(<HookHarness session={sessionObj} />);

    // At this point effect scheduled a timeout; the put should NOT be called yet
    expect(mockPut).not.toHaveBeenCalled();

    // Advance timers by slightly less than debounce
    vi.advanceTimersByTime(199);
    expect(mockPut).not.toHaveBeenCalled();

    // Advance the remaining time to hit 200ms debounce
    vi.advanceTimersByTime(1);

    // Wait for the effect to complete
    await vi.runAllTimersAsync();

    // Now the debounced function should run and call openDB -> put
    // Because openDB was mocked to return an object with put, it should be called.
    expect(mockPut).toHaveBeenCalledTimes(1);
    // Verify put was called with the same store/key/session used in the hook
    // The hook uses constants: STORE = 'sessions', SESSION_KEY = 'current_session_v1'
    expect(mockPut).toHaveBeenCalledWith('sessions', sessionObj, 'current_session_v1');
  });

  it('does not call put when session is null', async () => {
    render(<HookHarness session={null} />);

    // Advance time beyond debounce just in case
    vi.advanceTimersByTime(500);

    expect(mockPut).not.toHaveBeenCalled();
  });

  it('loadSession returns the stored session (via db.get) and clearSession calls delete', async () => {
    // make mockGet resolve to a stored session object
    const stored = { id: 'restored', players: [{ name: 'X' }] };
    mockGet.mockResolvedValueOnce(stored);

    render(<HookHarness session={null} />);

    // access helpers exposed on window
    // @ts-ignore
    const helpers = (window as any).__persistHelpers;
    expect(helpers).toBeDefined();
    // call loadSession and verify it returns stored value
    const loaded = await helpers.loadSession();
    expect(loaded).toEqual(stored);
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith('sessions', 'current_session_v1');

    // Now call clearSession and ensure delete called
    mockDelete.mockResolvedValueOnce(undefined);
    await helpers.clearSession();
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockDelete).toHaveBeenCalledWith('sessions', 'current_session_v1');
  });

  it('cleans up timeout on unmount', async () => {
    const sessionObj = { id: 's3' };

    const { unmount } = render(<HookHarness session={sessionObj} />);

    // a timeout should be scheduled; capture its id by spying setTimeout
    // Because we used fake timers, we can just unmount and advance — the put should not run after unmount
    unmount();

    // Advance time past debounce
    vi.advanceTimersByTime(300);

    // Because the effect's cleanup clears the timeout when unmounted, mockPut should not be called
    expect(mockPut).not.toHaveBeenCalled();
  });
});
