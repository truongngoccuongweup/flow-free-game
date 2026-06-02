import type { Puzzle } from '../engine/types';
import { endlessOrder } from './level-repository';

interface Manifest { total: number; buckets: number[]; }

export async function loadEndlessPuzzles(base = '/levels'): Promise<Puzzle[]> {
  const manifest = (await (await fetch(`${base}/manifest.json`)).json()) as Manifest;
  const lists = await Promise.all(
    manifest.buckets.map(async (b) => (await (await fetch(`${base}/bucket-${b}.json`)).json()) as Puzzle[]),
  );
  return endlessOrder(lists.flat());
}
