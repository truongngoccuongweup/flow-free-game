import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { mulberry32 } from './rng';
import { generateSolution } from './generate-solution';
import { puzzleFromSolution } from './derive-puzzle';
import { scoreDifficulty } from './score-difficulty';
import { bucketByDifficulty, buildDailySchedule } from './package';
import { countSolutions } from '../../src/engine/solver';
import type { Puzzle, Size } from '../../src/engine/types';

const SIZES: Size[] = [[5, 5], [6, 6], [7, 7], [8, 8]];
const TARGET = Number(process.env.COUNT ?? 500);   // total unique puzzles to emit
const OUT = resolve(process.cwd(), 'public/levels');

function run(): void {
  const puzzles: Puzzle[] = [];
  const seen = new Set<string>();
  let seed = 1;
  let attempts = 0;
  while (puzzles.length < TARGET && attempts < TARGET * 200) {
    attempts++;
    const size = SIZES[seed % SIZES.length];
    const sol = generateSolution(size, mulberry32(seed++));
    if (!sol) continue;
    const draft = puzzleFromSolution(sol, size, 'tmp', 0);
    if (countSolutions(draft, 2) !== 1) continue;   // keep only uniquely-solvable
    const difficulty = scoreDifficulty(sol, size);
    const id = `s${size[0]}-${puzzles.length.toString().padStart(5, '0')}`;
    const sig = JSON.stringify(draft.pairs);
    if (seen.has(sig)) continue;
    seen.add(sig);
    puzzles.push({ ...draft, id, difficulty });
  }

  const byBucket = bucketByDifficulty(puzzles);
  const schedule = buildDailySchedule(byBucket, '2026-06-01', 400);

  mkdirSync(OUT, { recursive: true });
  for (const [bucket, list] of Object.entries(byBucket)) {
    writeFileSync(resolve(OUT, `bucket-${bucket}.json`), JSON.stringify(list));
  }
  writeFileSync(resolve(OUT, 'daily-schedule.json'), JSON.stringify(schedule));
  writeFileSync(
    resolve(OUT, 'manifest.json'),
    JSON.stringify({ total: puzzles.length, buckets: Object.keys(byBucket).map(Number).sort((a, b) => a - b), generatedAttempts: attempts }),
  );
  console.log(`Generated ${puzzles.length} puzzles across buckets ${Object.keys(byBucket).sort().join(', ')}; schedule=${schedule.length} days.`);
}

run();
