'use client';
import { track as vercelTrack } from '@vercel/analytics';

export type EventProps = Record<string, string | number | boolean | null>;

/**
 * Thin analytics wrapper. Swap the implementation here to move off Vercel
 * Analytics (e.g. PostHog/GA) without touching call sites. No-ops safely when
 * analytics isn't available (dev / not enabled).
 */
export function track(event: string, props?: EventProps): void {
  try {
    vercelTrack(event, props);
  } catch {
    /* analytics unavailable — ignore */
  }
}
