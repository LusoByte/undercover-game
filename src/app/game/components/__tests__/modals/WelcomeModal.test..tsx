import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WelcomeModal from '../../modals/WelcomeModal';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('WelcomeModal', () => {
  it('renders nothing when open is false', () => {
    const onSelect = vi.fn();
    const { container } = render(<WelcomeModal open={false} onSelect={onSelect} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders title, description and option buttons when open is true', () => {
    const onSelect = vi.fn();
    render(<WelcomeModal open={true} onSelect={onSelect} />);

    expect(screen.getByRole('heading', { name: /Welcome to Undercover!/i })).toBeInTheDocument();
    expect(screen.getByText(/Choose how many players/i)).toBeInTheDocument();

    // 9 options from 4..12
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(9);

    // check presence of a few option labels
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('calls onSelect with the correct number when an option is clicked', async () => {
    const onSelect = vi.fn();
    render(<WelcomeModal open={true} onSelect={onSelect} />);

    const user = userEvent.setup();

    // Click the button that displays '6'
    const btn6 = screen.getByText('6').closest('button')!;
    await user.click(btn6);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(6);

    // Click '10' as well
    const btn10 = screen.getByText('10').closest('button')!;
    await user.click(btn10);

    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(onSelect).toHaveBeenLastCalledWith(10);
  });
});
