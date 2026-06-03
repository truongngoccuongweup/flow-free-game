'use client';
import { useCallback, useEffect, useState } from 'react';

const NAME = 'daily-flow-name';
const CID = 'daily-flow-cid';

function readCid(): string {
  try {
    let c = localStorage.getItem(CID);
    if (!c) {
      c = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `c${Date.now()}${Math.floor(Math.random() * 1e6)}`;
      localStorage.setItem(CID, c);
    }
    return c;
  } catch {
    return 'anon';
  }
}

export function useNickname() {
  const [name, setName] = useState<string | null>(null);
  const [cid, setCid] = useState('anon');

  useEffect(() => {
    setCid(readCid());
    try { setName(localStorage.getItem(NAME)); } catch { /* ignore */ }
  }, []);

  const save = useCallback((n: string) => {
    try { localStorage.setItem(NAME, n); } catch { /* ignore */ }
    setName(n);
  }, []);

  return { name, cid, save, hasName: Boolean(name) };
}
