import React from 'react';
import { vi, afterEach, describe, it, expect } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

vi.mock('../game/Game', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-testid': 'mock-game' }, 'Mocked Game'),
  };
});

import Home from '../page';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Home page (src/app/page.tsx)', () => {
  it('renders the main title "Undercover"', () => {
    render(React.createElement(Home));
    const title = screen.getByRole('heading', { name: 'Undercover' });
    expect(title).toBeInTheDocument();
  });

  it('renders the subtitle text', () => {
    render(React.createElement(Home));
    expect(
      screen.getByText(/Welcome to lobby\. Please add the number of players and their names to play/i)
    ).toBeInTheDocument();
  });

  it('renders the Game component (mocked)', () => {
    render(React.createElement(Home));
    expect(screen.getByTestId('mock-game')).toBeInTheDocument();
  });
});
