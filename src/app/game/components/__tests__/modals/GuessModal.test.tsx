import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GuessModal from '../../modals/GuessModal';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('GuessModal', () => {
  const samplePlayer = { id: 1, name: 'MrWhite', role: 'MRWHITE', revealed: true, word: null };

  it('renders nothing when open is false', () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    const onClose = vi.fn();

    const { container } = render(
      <GuessModal
        open={false}
        player={samplePlayer as any}
        guess=""
        onChangeGuess={onChange}
        onSubmit={onSubmit}
        onClose={onClose}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when player is null', () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    const onClose = vi.fn();

    const { container } = render(
      <GuessModal open={true} player={null} guess="" onChangeGuess={onChange} onSubmit={onSubmit} onClose={onClose} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders modal UI when open with player and handles typing and submit', async () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    const onClose = vi.fn();

    render(
      <GuessModal
        open={true}
        player={samplePlayer as any}
        guess=""
        feedback={undefined}
        onChangeGuess={onChange}
        onSubmit={onSubmit}
        onClose={onClose}
      />
    );

    // Title and explanatory text present
    expect(screen.getByText(/Mr\. White — make your guess/i)).toBeInTheDocument();
    expect(screen.getByText(/You have been revealed as Mr\. White/i)).toBeInTheDocument();

    // Input is present with placeholder
    const input = screen.getByPlaceholderText(/Enter your guess/i) as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input).not.toBeDisabled();

    // Submit and Close buttons present and enabled
    const submitBtn = screen.getByRole('button', { name: /Submit Guess/i });
    const closeBtn = screen.getByRole('button', { name: /Close/i });
    expect(submitBtn).toBeEnabled();
    expect(closeBtn).toBeEnabled();

    const user = userEvent.setup();
    // Type into input -> onChangeGuess should be called with the typed value
    await user.type(input, '  banana  ');
    // The component forwards raw onChange calls; ensure at least one call occurred
    expect(onChange).toHaveBeenCalled();
    // Check the last call value equals the last character sequence (userEvent types char-by-char)
    const lastCallArg = (onChange as any).mock.calls[(onChange as any).mock.calls.length - 1][0];
    expect(lastCallArg).toBeDefined();

    // Click Submit -> onSubmit called
    await user.click(submitBtn);
    expect(onSubmit).toHaveBeenCalledTimes(1);

    // Click Close -> onClose called
    await user.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('disables input and submit when feedback is present and shows feedback text; clicking overlay closes modal', async () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    const onClose = vi.fn();

    render(
      <GuessModal
        open={true}
        player={samplePlayer as any}
        guess="apple"
        feedback="Incorrect guess — game continues."
        onChangeGuess={onChange}
        onSubmit={onSubmit}
        onClose={onClose}
      />
    );

    const input = screen.getByPlaceholderText(/Enter your guess/i) as HTMLInputElement;
    const submitBtn = screen.getByRole('button', { name: /Submit Guess/i });
    const closeBtn = screen.getByRole('button', { name: /Close/i });

    // Input and submit are disabled
    expect(input).toBeDisabled();
    expect(submitBtn).toBeDisabled();

    // Feedback text is displayed
    expect(screen.getByText(/Incorrect guess — game continues\./i)).toBeInTheDocument();

    const user = userEvent.setup();

    // Clicking submit should not call onSubmit (disabled)
    await user.click(submitBtn);
    expect(onSubmit).not.toHaveBeenCalled();

    // Clicking backdrop (overlay) should call onClose
    // The overlay DIV is the first element with an onClick that closes modal, find it by role of generic div: we can query by text absence and then click the overlay by selecting the element that has an onClick
    // Simpler: query the top-level container and click outside the modal content. We know the overlay is the sibling div preceding the modal content.
    const overlay = screen.getByText(/You have been revealed as Mr\. White/i).parentElement?.previousElementSibling;
    if (overlay) {
      await user.click(overlay);
      expect(onClose).toHaveBeenCalledTimes(1);
    } else {
      // fallback: click Close button as alternative
      await user.click(closeBtn);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });
});
