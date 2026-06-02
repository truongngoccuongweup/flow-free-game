import { describe, it, expect } from 'vitest';
import { shareUrl, puzzleIdFromSearch } from './share-url';

describe('shareUrl', () => {
  it('builds a /?puzzle= link and trims a trailing slash on origin', () => {
    expect(shareUrl('https://x.app', 's6-00042')).toBe('https://x.app/?puzzle=s6-00042');
    expect(shareUrl('https://x.app/', 's6-00042')).toBe('https://x.app/?puzzle=s6-00042');
  });
  it('encodes the id', () => {
    expect(shareUrl('https://x.app', 'a b')).toBe('https://x.app/?puzzle=a%20b');
  });
});

describe('puzzleIdFromSearch', () => {
  it('reads the puzzle param', () => {
    expect(puzzleIdFromSearch('?puzzle=s6-00042')).toBe('s6-00042');
    expect(puzzleIdFromSearch('?foo=1&puzzle=abc')).toBe('abc');
  });
  it('returns null when absent or empty', () => {
    expect(puzzleIdFromSearch('')).toBeNull();
    expect(puzzleIdFromSearch('?puzzle=')).toBeNull();
    expect(puzzleIdFromSearch('?x=1')).toBeNull();
  });
});
