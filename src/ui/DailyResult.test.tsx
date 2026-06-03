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
    expect(getByText(/Nhanh hơn 73%/, { selector: 'p' })).toBeTruthy();
    expect(getByText(/14:32:06/)).toBeTruthy();
  });
  it('shows the share text (with the link) in a readonly box', () => {
    const { container } = render(<DailyResult {...props} />);
    const box = container.querySelector('textarea') as HTMLTextAreaElement;
    expect(box).toBeTruthy();
    expect(box.value).toContain('Daily Flow #142');
    expect(box.value).toContain('https://x.app/?puzzle=s6-1');
    expect(box.readOnly).toBe(true);
  });
  it('copies the share text (link + result) to the clipboard', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const { getByText } = render(<DailyResult {...props} />);
    fireEvent.click(getByText(/Sao chép/));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    const copied = writeText.mock.calls[0][0] as string;
    expect(copied).toContain('Daily Flow #142');
    expect(copied).toContain('https://x.app/?puzzle=s6-1');
    await waitFor(() => expect(getByText(/Đã sao chép/)).toBeTruthy());
  });
});
