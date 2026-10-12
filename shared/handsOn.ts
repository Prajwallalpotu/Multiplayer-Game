export type HandsOnState = { frame: number[]; pipes: number[]; opened: string[] };
export const newHandsOn = (): HandsOnState => ({frame:[1,3,2,1], pipes:[1,0,2,1,1,3,2,1,0], opened:[]});
// Clockwork air channels: up, right, down, left. Source enters at tile 0's left.
export const PIPE_PORTS = [[3,1],[3,1],[3,2],[1,2],[3,1],[0,3],[0,1],[3,1],[3,1]];
export function connectedPipes(rotations: number[]): number[] {
  const path: number[] = []; let tile = 0, entrance = 3;
  while (!path.includes(tile) && tile >= 0 && tile < 9) {
    const ports = PIPE_PORTS[tile].map(p => (p + rotations[tile]) % 4);
    if (!ports.includes(entrance)) return path;
    path.push(tile);
    const out = ports.find(p => p !== entrance)!;
    const row = Math.floor(tile/3), col = tile%3;
    if (tile === 8 && out === 1) return path.length === 9 ? path : [];
    if ((out === 0 && row === 0) || (out === 1 && col === 2) || (out === 2 && row === 2) || (out === 3 && col === 0)) return path;
    tile += [-3,1,3,-1][out]; entrance = (out+2)%4;
  }
  return path;
}
export function pipesSolved(rotations: number[]) {
  const path = connectedPipes(rotations);
  return path.length === 9 && path.at(-1) === 8 && PIPE_PORTS[8].map(p => (p+rotations[8])%4).includes(1);
}
