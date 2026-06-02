export type Coord = [number, number];
export type Size = [number, number];
export interface Pair { color: number; a: Coord; b: Coord; }
export interface Puzzle { id: string; size: Size; difficulty: number; pairs: Pair[]; }
export interface Line { color: number; cells: Coord[]; }
export interface Solution { lines: Line[]; }
