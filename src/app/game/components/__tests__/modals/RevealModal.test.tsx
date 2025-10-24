// src/app/game/components/modals/RevealModal.test.tsx
import React from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Roles enum so strings are deterministic
vi.mock('../../enums', () => ({
  Roles: {
    Civilian: 'CIVILIAN',
    Undercover: 'UNDERCOVER',
    MrWhite: 'MRWHITE',
  },
}));

import RevealModal from '../../modals/RevealModal';
import { Roles } from '../../../enums';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('RevealModal', () => {
  const civilianPlayer = {
    id: 1,
    name: 'Alice',
    role: Roles.Civilian,
    revealed: true,
    word: 'banana',
  };

  const mrWhitePlayer = {
    id: 2,
    name: 'Eve',
    role: Roles.MrWhite,
    revealed: true,
    word: null,
  };

  it('renders nothing when open is false or player is null', () => {
    const onClose = vi.fn();

    const { container: c1 } = render(<RevealModal player={civilianPlayer as any} open={false} onClose={onClose} />);
    expect(c1).toBeEmptyDOMElement();

    const { container: c2 } = render(<RevealModal player={null} open={true} onClose={onClose} />);
    expect(c2).toBeEmptyDOMElement();
  });

  it('displays player name and word for a civilian (non-MrWhite) and closes on Got it / overlay', async () => {
    const onClose = vi.fn();
    render(<RevealModal player={civilianPlayer as any} open={true} onClose={onClose} />);

    // Name and explanatory text
    expect(
      screen.getByRole('heading', { name: new RegExp(`Hello, ${civilianPlayer.name}!`, 'i') })
    ).toBeInTheDocument();
    expect(screen.getByText(/This is your private role reveal/i)).toBeInTheDocument();

    // The word should be shown — component uses backticks and quotes but text content includes the word
    expect(screen.getByText(new RegExp(civilianPlayer.word, 'i'))).toBeInTheDocument();

    // "Got it" button closes
    const user = userEvent.setup();
    const gotIt = screen.getByRole('button', { name: /Got it/i });
    await user.click(gotIt);
    expect(onClose).toHaveBeenCalledTimes(1);

    // Re-render and click overlay to close (overlay is the sibling absolute div that precedes modal content)
    cleanup();
    render(<RevealModal player={civilianPlayer as any} open={true} onClose={onClose} />);
    // Find the overlay by walking DOM: overlay is the element with onClick before the modal content.
    // We can locate the explanatory text and go to previousElementSibling to find overlay.
    const expl = screen.getByText(/This is your private role reveal/i);
    const overlay = expl.parentElement?.previousElementSibling;
    if (overlay) {
      await user.click(overlay);
      expect(onClose).toHaveBeenCalledTimes(2);
    }
  });

  it('displays Mr. White special UI when role is MrWhite and closes on Got it', async () => {
    const onClose = vi.fn();
    render(<RevealModal player={mrWhitePlayer as any} open={true} onClose={onClose} />);

    // Title with player's name
    expect(screen.getByRole('heading', { name: new RegExp(`Hello, ${mrWhitePlayer.name}!`, 'i') })).toBeInTheDocument();

    // The role badge should show "Mr. White" (titleCaseRole)
    expect(screen.getAllByText(/Mr\. White/i)).toHaveLength(2);

    // The special italic hint about being Mr. White should be present
    expect(
      screen.getByText((content, element) => {
        return element?.textContent === 'You are Mr. White.';
      })
    ).toBeInTheDocument();

    // Click Got it -> onClose
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Got it/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
