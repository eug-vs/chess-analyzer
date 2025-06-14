import { Position } from "./store";

export function extractSideToMove(fen: string) {
  return fen.split(" ")[1] === "w" ? "white" : "black";
}

export async function analyzeCPL(position: Position, depth = 20) {
  // Dynamic import for client-only code
  const { analyzePositions } = await import("@/workers/stockfish");
  return analyzePositions(
    [position.fen, ...position.moves.map((move) => move.to.fen)],
    depth,
  );
}
