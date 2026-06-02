'use client';
import { useEffect, useRef, useState } from 'react';

export function useStopwatch(running: boolean) {
  const startRef = useRef<number>(Date.now());
  const [ms, setMs] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setMs(Date.now() - startRef.current), 250);
    return () => clearInterval(id);
  }, [running]);
  const elapsed = (): number => Date.now() - startRef.current;
  return { ms, elapsed };
}
