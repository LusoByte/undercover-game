import React from 'react';
import { vi, afterEach, describe, it, expect } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../enums', () => ({
  Roles: {
    Civilian: 'CIVILIAN',
    Undercover: 'UNDERCOVER',
    MrWhite: 'MRWHITE',
  },
}));

import PlayerCard from '../PlayerCard';
import { Roles } from '../../enums';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('PlayerCard', () => {
  it('renders the player name and shows "Click to reveal" when not revealed', async () => {
    const onReveal = vi.fn();
    const player = { id: 1, name: 'Alice', role: Roles.Civilian, revealed: false };

    render(<PlayerCard player={player as any} index={0} onReveal={onReveal} />);

    // Name renders
    expect(screen.getByText('Alice')).toBeInTheDocument();

    // Hint text visible
    expect(screen.getByText(/Click to reveal/i)).toBeInTheDocument();

    // Click should call onReveal once with index
    const user = userEvent.setup();
    await user.click(screen.getByText('Alice').closest('div') as Element); // click the card container
    expect(onReveal).toHaveBeenCalledTimes(1);
    expect(onReveal).toHaveBeenCalledWith(0);
  });

  it('does not call onReveal when already revealed', async () => {
    const onReveal = vi.fn();
    const player = { id: 2, name: 'Bob', role: Roles.Civilian, revealed: true };

    render(<PlayerCard player={player as any} index={1} onReveal={onReveal} />);

    // "Click to reveal" should NOT be present
    expect(screen.queryByText(/Click to reveal/i)).toBeNull();

    // Role label should display "Civilian"
    expect(screen.getByText(/Civilian/i)).toBeInTheDocument();

    // Clicking should NOT call onReveal
    const user = userEvent.setup();
    await user.click(screen.getByText('Bob').closest('div') as Element);
    expect(onReveal).not.toHaveBeenCalled();
  });

  it('displays "Undercover" label when role is Undercover and revealed', () => {
    const onReveal = vi.fn();
    const player = { id: 3, name: 'Eve', role: Roles.Undercover, revealed: true };

    render(<PlayerCard player={player as any} index={2} onReveal={onReveal} />);

    expect(screen.getByText('Eve')).toBeInTheDocument();
    expect(screen.getByText(/Undercover/i)).toBeInTheDocument();
  });

  it('displays "Mr. White" label when role is MrWhite and revealed', () => {
    const onReveal = vi.fn();
    const player = { id: 4, name: 'Mallory', role: Roles.MrWhite, revealed: true };

    render(<PlayerCard player={player as any} index={3} onReveal={onReveal} />);

    expect(screen.getByText('Mallory')).toBeInTheDocument();
    expect(screen.getByText(/Mr\. White/i)).toBeInTheDocument();
  });
});
