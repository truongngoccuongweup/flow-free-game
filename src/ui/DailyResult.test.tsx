// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { DailyResult } from './DailyResult';

afterEach(cleanup);

const props = {
  dayNumber: 142, timeText: '0:48', fasterThan: 73, streak: 8, colorCount: 5,
  countdownText: '14:32:06', shareUrl: 'https://x.app/?puzzle=s6-1', onPlayEndless: () => {},
};

describe('DailyResult', () => {
  it('shows time, rank, streak and countdown', () => {
    const { getByText } = render(<DailyResult {...props} />);
    expect(getByText('0:48')).toBeTruthy();
    expect(getByText(/Nhanh hơn 73%/)).toBeTruthy();
    expect(getByText(/14:32:06/)).toBeTruthy();
  });
  it('shares a link (clipboard fallback) containing the share URL', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    // ensure Web Share API is treated as unavailable so it falls back to clipboard
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    const { getByText } = render(<DailyResult {...props} />);
    fireEvent.click(getByText('Khoe & rủ bạn chơi'));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    const copied = writeText.mock.calls[0][0] as string;
    expect(copied).toContain('Daily Flow #142');
    expect(copied).toContain('https://x.app/?puzzle=s6-1');
    await waitFor(() => expect(getByText(/Đã chia sẻ/)).toBeTruthy());
  });
  it('prefers the Web Share API when available', async () => {
    const share = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    const { getByText } = render(<DailyResult {...props} />);
    fireEvent.click(getByText('Khoe & rủ bạn chơi'));
    await waitFor(() => expect(share).toHaveBeenCalled());
    expect(share.mock.calls[0][0].url).toBe('https://x.app/?puzzle=s6-1');
  });
});
