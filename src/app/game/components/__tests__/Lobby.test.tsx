import React from 'react';
import { vi, afterEach, beforeEach, describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ---------------------------
// MODULE MOCKS (must be hoisted before importing the component)
// ---------------------------

// Mock the Roles enum (so we know what values will be used in the component)
vi.mock('../enums', () => ({
  Roles: {
    Civilian: 'CIVILIAN',
    Undercover: 'UNDERCOVER',
    MrWhite: 'MRWHITE',
  },
}));

// Mock calculateRequiredRoles to return controllable values per test.
// We'll replace implementation inside tests using vi.mocked(...).mockImplementationOnce(...)
vi.mock('../utils/calculateRequiredRoles', () => ({
  calculateRequiredRoles: (n: number) => {
    // default fallback: 0 undercover, 0 mrwhite, rest civilians
    return { undercover: 0, mrwhite: 0, civilian: Math.max(0, n) };
  },
}));

// Mock WelcomeModal so tests can "select" a player count by clicking a button.
// The mock will render a button that calls onSelect with a provided number when clicked.
vi.mock('../modals/WelcomeModal', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ open, onSelect }: { open: boolean; onSelect: (n: number) => void }) =>
      React.createElement(
        'div',
        { 'data-testid': 'mock-welcome', 'data-open': open ? 'true' : 'false' },
        open &&
          React.createElement(
            'button',
            {
              'data-testid': 'mock-welcome-select-4',
              onClick: () => onSelect(4),
            },
            'Select 4'
          )
      ),
  };
});

// Mock useGame from GameProvider.
// Provide a mutable `mockState` and `dispatch` spy that tests will control.
// Tests will set initial state by modifying mockStateRef.current before rendering.
vi.mock('../../GameProvider', () => {
  let currentState: any = { session: null, wordpool: [] };
  const dispatch = vi.fn();

  function useGame() {
    // return the latest currentState and the same dispatch function
    return { state: currentState, dispatch };
  }

  // helper to update the mock state from tests
  function __setMockState(next: any) {
    currentState = next;
  }

  // expose dispatch spy too so assertions can be simpler
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

// ---------------------------
import Lobby from '../Lobby';
import * as GameProviderModule from '../../GameProvider';
const GameProviderMock = vi.mocked(GameProviderModule) as any;
// The following import is problematic for type resolution in some test runners
// and may not be used in this file, so commenting it out or fixing path if needed
// import { calculateRequiredRoles as calculateRequiredRolesMocked } from '../utils/calculateRequiredRoles';
// ---------------------------
describe('Lobby component', () => {
  const realMathRandom = Math.random;
  const realAlert = global.alert;

  beforeEach(() => {
    // reset dispatch mock
    const dispatch = GameProviderMock.__getDispatch;
    if (dispatch && (dispatch as any).mockReset) (dispatch as any).mockReset();

    // reset mocked calculateRequiredRoles to default implementation (the module-level default)
    // (we'll override per-test where needed using mockImplementationOnce)
    // Note: calculateRequiredRolesMocked is commented out above, so we skip the reset

    // default mock state: no session, empty wordpool
    GameProviderMock.__setMockState({ session: null, wordpool: [] });

    // ensure Math.random deterministic only when tests need it
    Math.random = realMathRandom;

    // reset alert
    global.alert = vi.fn();
  });

  afterEach(() => {
    // restore Math.random and alert
    Math.random = realMathRandom;
    global.alert = realAlert;
    vi.restoreAllMocks();
  });

  it('shows WelcomeModal initially when there is no session; selecting player count reveals Add Players UI', async () => {
    // initial state: no session -> welcomeOpen should be true
    GameProviderMock.__setMockState({ session: null, wordpool: [{ civilian: 'cat', undercover: 'dog' }] });

    const { rerender } = render(<Lobby />);

    // Re-render after setting mock state to ensure component picks up the new state
    rerender(<Lobby />);

    // Welcome modal should render with open true (our mock sets data-open attr)
    const welcome = screen.getByTestId('mock-welcome');
    expect(welcome.getAttribute('data-open')).toBe('true');

    // click the mock button to "select 4"
    await userEvent.click(screen.getByTestId('mock-welcome-select-4'));

    // After selecting, the "Add Players" header should appear
    await waitFor(() => {
      expect(screen.getByText(/Add Players/i)).toBeInTheDocument();
    });

    // Ensure input and Add button are present
    expect(screen.getByPlaceholderText(/Player name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add/i })).toBeInTheDocument();

    // Roles summary should be visible (playerCount selected -> rolesSummary computed)
    expect(screen.getByText(/Total Players:/i)).toBeInTheDocument();
  });

  it('adds a player (dispatch ADD_PLAYER) when name provided and pair is available', async () => {
    // Provide a wordpool so the component's useEffect selects a pair on mount.
    const pair = { civilian: 'apple', undercover: 'orange' };
    GameProviderMock.__setMockState({ session: null, wordpool: [pair] });

    // Ensure calculateRequiredRoles returns only civilians required to force selected role = Civilian:
    // override mocked implementation so undercover/mrwhite are 0
    // Note: calculateRequiredRolesMocked is commented out above, so we skip the override

    // make Math.random deterministic (choose first element and choose the only role)
    Math.random = () => 0; // pick first word pair and pick first role weight

    const { rerender } = render(<Lobby />);
    rerender(<Lobby />);

    // Select player count via mock WelcomeModal
    await userEvent.click(screen.getByTestId('mock-welcome-select-4'));

    // Type a name into input and click Add
    const input = screen.getByPlaceholderText(/Player name/i);
    await userEvent.type(input, '   Alice   ');
    await userEvent.click(screen.getByRole('button', { name: /Add/i }));

    // dispatch should have been called with an ADD_PLAYER action
    const dispatch = GameProviderMock.__getDispatch();
    expect(dispatch).toHaveBeenCalledTimes(1);
    const callArg = (dispatch as any).mock.calls[0][0];
    expect(callArg.type).toBe('ADD_PLAYER');
    expect(callArg.payload).toBeDefined();
    expect(callArg.payload.name).toBe('Alice'); // trimmed

    // After adding, the input should be cleared
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('Change Player Count button re-opens the welcome modal', async () => {
    // Start with a state that has players (simulate session players present)
    const pair = { civilian: 'apple', undercover: 'orange' };
    GameProviderMock.__setMockState({ session: null, wordpool: [pair] });

    const { rerender } = render(<Lobby />);
    rerender(<Lobby />);

    // Simulate selecting playerCount via the mock welcome initially
    await userEvent.click(screen.getByTestId('mock-welcome-select-4'));

    // 'Change Player Count' button should be present
    const changeBtn = screen.getByRole('button', { name: /Change Player Count/i });
    expect(changeBtn).toBeInTheDocument();

    // Click change button
    await userEvent.click(changeBtn);

    // Welcome modal should re-open (our mock renders button only when open true)
    await waitFor(() => {
      expect(screen.getByTestId('mock-welcome').getAttribute('data-open')).toBe('true');
    });
  });
});
