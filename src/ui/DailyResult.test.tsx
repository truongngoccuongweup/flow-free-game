// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { DailyResult } from './DailyResult';

afterEach(cleanup);

const props = {
  dayNumber: 142, timeText: '0:48', fasterThan: 73, streak: 8, colorCount: 5,
  countdownText: '14:32:06', onPlayEndless: () => {},
};

describe('DailyResult', () => {
  it('shows time, rank, streak and countdown', () => {
    const { getByText } = render(<DailyResult {...props} />);
    expect(getByText('0:48')).toBeTruthy();
    expect(getByText(/Nhanh hơn 73%/)).toBeTruthy();
    expect(getByText(/14:32:06/)).toBeTruthy();
  });
  it('copies spoiler-free share text to the clipboard', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const { getByText } = render(<DailyResult {...props} />);
    fireEvent.click(getByText('Khoe kết quả'));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(writeText.mock.calls[0][0]).toContain('Daily Flow #142');
    await waitFor(() => expect(getByText(/Đã copy/)).toBeTruthy());
  });
});
