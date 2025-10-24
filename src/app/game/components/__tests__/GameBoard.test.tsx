import { vi, afterEach, describe, it, expect } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// -----------------------------
// HOISTED MOCKS
// -----------------------------

// Mock Roles enum
vi.mock('../../enums', () => ({
  Roles: {
    Civilian: 'CIVILIAN',
    Undercover: 'UNDERCOVER',
    MrWhite: 'MRWHITE',
  },
}));

// Mock PlayerCard: renders a button that calls onReveal(index) when clicked
vi.mock('../PlayerCard', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ player, index, onReveal }: any) =>
      React.createElement(
        'button',
        {
          'data-testid': `player-${index}`,
          onClick: () => onReveal(index),
        },
        player?.name ?? `player-${index}`
      ),
  };
});

// Mock GuessModal: renders input, submit button, shows feedback prop
vi.mock('../modals/GuessModal', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ open, player, guess, feedback, onChangeGuess, onSubmit, onClose }: any) =>
      React.createElement(
        'div',
        { 'data-testid': 'mock-guess', 'data-open': open ? 'true' : 'false' },
        open &&
          React.createElement(
            'div',
            {},
            React.createElement('div', { 'data-testid': 'mock-guess-player' }, player?.name ?? 'no-player'),
            React.createElement('input', {
              'data-testid': 'mock-guess-input',
              value: guess,
              onChange: (e: any) => onChangeGuess(e.target.value),
            }),
            React.createElement('button', { 'data-testid': 'mock-guess-submit', onClick: onSubmit }, 'Submit'),
            React.createElement('button', { 'data-testid': 'mock-guess-close', onClick: onClose }, 'Close'),
            feedback && React.createElement('div', { 'data-testid': 'mock-guess-feedback' }, feedback)
          )
      ),
  };
});

// Mock checkGameEnd util: we'll override implementation per-test via the mocked module
vi.mock('../../utils/checkGameEnd', () => ({
  checkGameEnd: vi.fn(() => null),
}));

// Mock useGame provider with helpers to set state & get dispatch spy.
// The mock exposes __setMockState and __getDispatch at runtime.
vi.mock('../../GameProvider', () => {
  let currentState: any = { session: { players: [] }, wordpool: [] };
  const dispatch = vi.fn();
  const persist = { clearSession: vi.fn() };

  function useGame() {
    return { state: currentState, dispatch, persist };
  }

  function __setMockState(s: any) {
    currentState = s;
  }

  function __getDispatch() {
    return dispatch;
  }

  return {
    __esModule: true,
    useGame,
    __setMockState,
    __getDispatch,
  };
});

// -----------------------------
// Now import the component under test (after mocks)
// -----------------------------
import GameBoard from '../GameBoard';
import * as GameProviderModule from '../../GameProvider';

// Grab helpers from the mocked GameProvider
const GameProviderMock: any = vi.mocked(GameProviderModule);
const __setMockState: (s: any) => void = GameProviderMock.__setMockState;
const __getDispatch: () => any = GameProviderMock.__getDispatch;

// Grab mocked checkGameEnd so tests can change its behavior
import * as CheckGameEndModule from '../../utils/checkGameEnd';
const checkGameEndMock: import('vitest').Mock | any = vi.mocked(CheckGameEndModule.checkGameEnd);

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// -----------------------------
// Tests
// -----------------------------
describe('GameBoard', () => {
  it('renders player cards and Reset Game button', () => {
    __setMockState({
      session: { players: [{ id: 1, name: 'A', role: 'CIVILIAN', revealed: false }] },
      wordpool: [],
    });

    render(<GameBoard />);

    expect(screen.getByTestId('player-0')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reset Game/i })).toBeInTheDocument();
  });

  it('reveals non-MrWhite player and dispatches updated players with revealedCount when no winner', async () => {
    // players: one civilian -> reveal index 0 should update revealed true and set revealedCount
    __setMockState({
      session: {
        players: [{ id: 1, name: 'Alice', role: 'CIVILIAN', revealed: false }],
      },
      wordpool: [{ civilian: 'apple', undercover: 'orange' }],
    });

    // checkGameEnd returns null (no winner)
    checkGameEndMock.mockImplementationOnce(() => null);

    render(<GameBoard />);

    await userEvent.click(screen.getByTestId('player-0'));

    // dispatch should have been called with SET_SESSION updating players and revealedCount
    await waitFor(() => {
      const dispatch = __getDispatch();
      expect(dispatch).toHaveBeenCalled();
      const arg = dispatch.mock.calls[0][0];
      expect(arg.type).toBe('SET_SESSION');
      expect(arg.payload.players[0].revealed).toBe(true);
      expect(arg.payload.revealedCount).toBe(1);
    });
  });

  it('reveals non-MrWhite player and dispatches SET_SESSION with winner when checkGameEnd returns a winner', async () => {
    __setMockState({
      session: {
        players: [
          { id: 1, name: 'A', role: 'CIVILIAN', revealed: false },
          { id: 2, name: 'B', role: 'UNDERCOVER', revealed: false },
        ],
        pair: { civilian: 'apple', undercover: 'orange' },
      },
      wordpool: [{ civilian: 'apple', undercover: 'orange' }],
    });

    // Simulate that after revealing player 1 a winner is detected (UNDERCOVER)
    checkGameEndMock.mockImplementationOnce(() => 'UNDERCOVER');

    render(<GameBoard />);

    // Reveal player index 1
    await userEvent.click(screen.getByTestId('player-1'));

    await waitFor(() => {
      const dispatch = __getDispatch();
      expect(dispatch).toHaveBeenCalled();
      const arg = dispatch.mock.calls[0][0];
      expect(arg.type).toBe('SET_SESSION');
      expect(arg.payload.winner).toBe('UNDERCOVER');
    });
  });

  it('revealing Mr. White opens the guess modal and dispatches updated players/revealedCount', async () => {
    __setMockState({
      session: {
        players: [
          { id: 1, name: 'C', role: 'MRWHITE', revealed: false },
          { id: 2, name: 'D', role: 'CIVILIAN', revealed: false },
        ],
        pair: { civilian: 'apple', undercover: 'orange' },
      },
      wordpool: [{ civilian: 'apple', undercover: 'orange' }],
    });

    // For this test, checkGameEnd shouldn't be relevant, but ensure it returns null
    checkGameEndMock.mockImplementationOnce(() => null);

    render(<GameBoard />);

    // click the MrWhite player
    await userEvent.click(screen.getByTestId('player-0'));

    // dispatch called to update players + revealedCount
    await waitFor(() => {
      const dispatch = __getDispatch();
      expect(dispatch).toHaveBeenCalled();
      const arg = dispatch.mock.calls[0][0];
      expect(arg.type).toBe('SET_SESSION');
      expect(arg.payload.players[0].revealed).toBe(true);
      expect(arg.payload.revealedCount).toBe(1);
    });

    // Guess modal should be rendered open by our mock
    const gm = screen.getByTestId('mock-guess');
    expect(gm.getAttribute('data-open')).toBe('true');

    // The mock also renders the player name inside mock-guess-player
    expect(screen.getByTestId('mock-guess-player').textContent).toBe('C');
  });

  it('submits a correct Mr. White guess -> dispatch winner MRWHITE and endedAt is set, and all players revealed', async () => {
    __setMockState({
      session: {
        players: [
          { id: 1, name: 'Mr', role: 'MRWHITE', revealed: false },
          { id: 2, name: 'P', role: 'CIVILIAN', revealed: false },
        ],
        pair: { civilian: 'apple', undercover: 'orange' },
      },
      wordpool: [{ civilian: 'apple', undercover: 'orange' }],
    });

    // open guess modal by simulating reveal
    render(<GameBoard />);
    // reveal MrWhite
    await userEvent.click(screen.getByTestId('player-0'));

    // Fill guess input with the correct civilian word (case-insensitive)
    const input = screen.getByTestId('mock-guess-input') as HTMLInputElement;
    await userEvent.type(input, '  Apple  ');

    // click submit
    await userEvent.click(screen.getByTestId('mock-guess-submit'));

    // Expect dispatch called with SET_SESSION where winner is MRWHITE and players are all revealed
    await waitFor(() => {
      const dispatch = __getDispatch();
      // expect at least one call that contains the winner
      const found = dispatch.mock.calls.find(
        (c: any) => c[0]?.type === 'SET_SESSION' && c[0].payload?.winner === 'MRWHITE'
      );
      expect(found).toBeTruthy();
      const payload = found[0].payload;
      expect(payload.endedAt).toBeDefined();
      // all players revealed
      expect(payload.players.every((p: any) => p.revealed)).toBe(true);
    });
  });

  it('submits an incorrect Mr. White guess -> sets feedback and dispatches revealed update', async () => {
    __setMockState({
      session: {
        players: [
          { id: 1, name: 'Mr', role: 'MRWHITE', revealed: false },
          { id: 2, name: 'P', role: 'CIVILIAN', revealed: false },
        ],
        pair: { civilian: 'apple', undercover: 'orange' },
      },
      wordpool: [{ civilian: 'apple', undercover: 'orange' }],
    });

    // Ensure checkGameEnd returns null for the updated players after incorrect reveal
    checkGameEndMock.mockImplementationOnce(() => null);

    render(<GameBoard />);
    // reveal MrWhite (this opens guess modal)
    await userEvent.click(screen.getByTestId('player-0'));

    // type incorrect guess
    const input = screen.getByTestId('mock-guess-input') as HTMLInputElement;
    await userEvent.type(input, 'banana');

    // submit
    await userEvent.click(screen.getByTestId('mock-guess-submit'));

    // The mock GuessModal will receive the feedback prop; our mock renders it when present.
    // Wait for feedback element to appear
    await waitFor(() => {
      expect(screen.getByTestId('mock-guess-feedback').textContent).toContain('Incorrect guess');
    });

    // dispatch should have been called to reveal MrWhite and update revealedCount
    await waitFor(() => {
      const dispatch = __getDispatch();
      expect(dispatch).toHaveBeenCalled();
      // find a SET_SESSION call where players[0].revealed === true
      const found = dispatch.mock.calls.find(
        (c: any) => c[0]?.type === 'SET_SESSION' && c[0].payload?.players?.[0]?.revealed === true
      );
      expect(found).toBeTruthy();
    });
  });

  it('Reset Game button clears persisted session and dispatches RESET', async () => {
    const persistClear = vi.fn();
    // set mock state with custom persist on state returned by useGame
    // To attach custom persist, we override the mocked module state directly:
    __setMockState({
      session: { players: [] },
      wordpool: [],
      // note: the mocked useGame returns the same `persist` object created in the mock, above,
      // but to be safe we can spy on that object's clearSession via require:
    });

    // grab the dispatch & persist from the mocked module
    const dispatch = GameProviderMock.__getDispatch();
    const mockedPersistObj = GameProviderMock.useGame().persist as any;
    // replace persist.clearSession with our spy
    mockedPersistObj.clearSession = persistClear;

    render(<GameBoard />);

    // click Reset Game button
    await userEvent.click(screen.getByRole('button', { name: /Reset Game/i }));

    await waitFor(() => {
      // persist clear called
      expect(persistClear).toHaveBeenCalled();
      // dispatch RESET called
      expect(dispatch).toHaveBeenCalled();
      const resetCall = dispatch.mock.calls.find((c: any) => c[0]?.type === 'RESET');
      expect(resetCall).toBeTruthy();
    });
  });
});
