import React from 'react';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import { render, screen, cleanup, waitForElementToBeRemoved } from '@testing-library/react';

// Mock framer-motion so animations don't run and to give us testable hooks into the DOM.
// We detect different motion.div usages by inspecting props (className / style) and add testids:
//  - container: props.className contains 'pointer-events-none' => data-testid="confetti-container"
//  - piece: props.style contains 'left' (a piece has left/top) => data-testid="confetti-piece"
//  - winner wrapper: props.className contains 'inset-0 flex' => data-testid="winner-wrapper"
vi.mock('framer-motion', () => {
  const React = require('react');

  function MotionDiv(props: any) {
    // Determine a helpful test id depending on props
    let testid: string | undefined;

    const className: string = props?.className ?? '';
    const style: Record<string, any> = props?.style ?? {};

    if (className.includes('pointer-events-none')) {
      testid = 'confetti-container';
    } else if (className.includes('inset-0 flex')) {
      testid = 'winner-wrapper';
    } else if (style && ('left' in style || 'top' in style)) {
      testid = 'confetti-piece';
    }

    // Render simple div preserving children and other props (without animation)
    const { children, ...rest } = props;
    const passedProps = { ...rest } as any;
    if (testid) passedProps['data-testid'] = testid;

    return React.createElement('div', passedProps, children);
  }

  return {
    __esModule: true,
    AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
    motion: {
      div: MotionDiv,
    },
  };
});

import Confetti from '../Confetti';

describe('Confetti component', () => {
  const realInnerWidth = global.innerWidth;
  const realInnerHeight = global.innerHeight;
  const realMathRandom = Math.random;

  beforeEach(() => {
    // fix viewport for deterministic coordinates
    // (Confetti uses window.innerWidth/innerHeight)
    global.innerWidth = 1024;
    global.innerHeight = 768;

    // make Math.random deterministic so generated pieces are stable across runs
    vi.spyOn(Math, 'random').mockImplementation(() => 0.5);

    // use fake timers so we can advance the timeout
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    // restore everything
    vi.useRealTimers();
    (Math.random as any).mockRestore?.();
    global.innerWidth = realInnerWidth;
    global.innerHeight = realInnerHeight;
    vi.restoreAllMocks();
  });

  it('renders nothing when play is false', () => {
    render(<Confetti play={false} />);

    // No confetti container or winner UI should be present
    expect(screen.queryByTestId('confetti-container')).toBeNull();
    expect(screen.queryByText(/WINNER!/i)).toBeNull();
  });

  it('renders confetti and clears after 3s', async () => {
    vi.useRealTimers();

    render(<Confetti play={true} />);

    // wait for container and pieces
    const container = await screen.findByTestId('confetti-container');
    expect(container).toBeInTheDocument();
    const pieces = await screen.findAllByTestId('confetti-piece');
    expect(pieces.length).toBe(50);

    await waitForElementToBeRemoved(() => screen.queryByTestId('confetti-container'), { timeout: 4000 });

    expect(screen.queryAllByTestId('confetti-piece').length).toBe(0);
  }, 10000);
});
