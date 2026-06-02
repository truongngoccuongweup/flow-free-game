import type { Puzzle, Size, Solution } from '../../src/engine/types';

export function puzzleFromSolution(
  solution: Solution,
  size: Size,
  id: string,
  difficulty: number,
): Puzzle {
  const pairs = solution.lines.map((l) => ({
    color: l.color,
    a: l.cells[0],
    b: l.cells[l.cells.length - 1],
  }));
  return { id, size, difficulty, pairs };
}
