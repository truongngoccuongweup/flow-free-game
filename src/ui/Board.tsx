'use client';
import type { PointerEvent, Ref } from 'react';
import type { Puzzle } from '../engine/types';
import type { PlayState } from '../game/play-state';
import { key } from '../engine/grid';
import { flowGlyph } from './palette';

const flowVar = (i: number): string => `var(--flow-${i % 8})`;

const U = 100;
const c = (n: number): number => n * U + U / 2;

interface BoardProps {
  puzzle: Puzzle;
  state: PlayState;
  showGlyphs?: boolean;
  svgRef?: Ref<SVGSVGElement>;
  onPointerDown?: (e: PointerEvent<SVGSVGElement>) => void;
  onPointerMove?: (e: PointerEvent<SVGSVGElement>) => void;
  onPointerUp?: (e: PointerEvent<SVGSVGElement>) => void;
}

export function Board({ puzzle, state, showGlyphs = true, svgRef, onPointerDown, onPointerMove, onPointerUp }: BoardProps) {
  const [w, h] = puzzle.size;
  const filled = new Set<string>();
  for (const cells of Object.values(state.paths)) for (const cell of cells) filled.add(key(cell));

  return (
    <svg
      ref={svgRef}
      data-testid="board"
      viewBox={`0 0 ${w * U} ${h * U}`}
      style={{ touchAction: 'none', width: '100%', height: 'auto', display: 'block' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {Array.from({ length: h }).flatMap((_, y) =>
        Array.from({ length: w }).map((_, x) =>
          filled.has(`${x},${y}`) ? null : <circle key={`d${x}-${y}`} cx={c(x)} cy={c(y)} r={6} fill="var(--dot)" />,
        ),
      )}
      {Object.keys(state.paths).map((ci) => {
        const cells = state.paths[Number(ci)];
        if (cells.length < 2) return null;
        const d = cells.map((p, i) => `${i === 0 ? 'M' : 'L'} ${c(p[0])} ${c(p[1])}`).join(' ');
        return (
          <path key={`p${ci}`} d={d} fill="none" stroke="currentColor" style={{ color: flowVar(Number(ci)) }} strokeWidth={U * 0.32} strokeLinecap="round" strokeLinejoin="round" />
        );
      })}
      {puzzle.pairs.flatMap((pair) =>
        [pair.a, pair.b].map((p, idx) => (
          <g key={`e${pair.color}-${idx}`} style={{ color: flowVar(pair.color) }}>
            <circle data-ep cx={c(p[0])} cy={c(p[1])} r={U * 0.34} fill="currentColor" />
            {showGlyphs && (
              <text x={c(p[0])} y={c(p[1])} textAnchor="middle" dominantBaseline="central" fontSize={U * 0.32} fill="#fff">
                {flowGlyph(pair.color)}
              </text>
            )}
          </g>
        )),
      )}
    </svg>
  );
}
