// Encodes/decodes which puzzle a shared link points to, so a recipient opens
// the app directly on the same level (e.g. https://site/?puzzle=s6-00042).

export function shareUrl(origin: string, puzzleId: string): string {
  const base = origin.replace(/\/$/, '');
  return `${base}/?puzzle=${encodeURIComponent(puzzleId)}`;
}

export function puzzleIdFromSearch(search: string): string | null {
  const id = new URLSearchParams(search).get('puzzle');
  return id && id.length > 0 ? id : null;
}
