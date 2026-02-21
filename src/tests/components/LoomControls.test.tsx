import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoomControls } from '../../components/LoomControls';

describe('LoomControls', () => {
  it('renders correctly with initial props', () => {
    render(
      <LoomControls
        progress={0.5}
        isPlaying={false}
        onProgressChange={() => {}}
        onTogglePlay={() => {}}
        onClose={() => {}}
      />
    );

    expect(screen.getByText('Chrono-Synaptic Loom')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('▶')).toBeInTheDocument(); // Play button
  });

  it('calls onTogglePlay when play button is clicked', () => {
    const onTogglePlay = vi.fn();
    render(
      <LoomControls
        progress={0.5}
        isPlaying={false}
        onProgressChange={() => {}}
        onTogglePlay={onTogglePlay}
        onClose={() => {}}
      />
    );

    fireEvent.click(screen.getByText('▶'));
    expect(onTogglePlay).toHaveBeenCalledTimes(1);
  });

  it('displays pause icon when playing', () => {
    render(
      <LoomControls
        progress={0.5}
        isPlaying={true}
        onProgressChange={() => {}}
        onTogglePlay={() => {}}
        onClose={() => {}}
      />
    );

    expect(screen.getByText('⏸')).toBeInTheDocument();
  });

  it('calls onProgressChange when slider changes', () => {
    const onProgressChange = vi.fn();
    render(
      <LoomControls
        progress={0.5}
        isPlaying={false}
        onProgressChange={onProgressChange}
        onTogglePlay={() => {}}
        onClose={() => {}}
      />
    );

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '0.8' } });
    expect(onProgressChange).toHaveBeenCalledWith(0.8);
  });
});
