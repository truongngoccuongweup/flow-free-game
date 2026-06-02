'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * Elapsed-time stopwatch. The clock does NOT start at mount — it starts the
 * first time `running` becomes true (i.e. the first user interaction), so the
 * timer reflects actual solving time, not idle time on the board.
 */
export function useStopwatch(running: boolean) {
  const startRef = useRef<number | null>(null);
  const [ms, setMs] = useState(0);

  useEffect(() => {
    if (!running) return;
    if (startRef.current === null) startRef.current = Date.now();
    const id = setInterval(() => {
      if (startRef.current !== null) setMs(Date.now() - startRef.current);
    }, 250);
    return () => clearInterval(id);
  }, [running]);

  const elapsed = (): number => (startRef.current === null ? 0 : Date.now() - startRef.current);
  return { ms, elapsed };
}
