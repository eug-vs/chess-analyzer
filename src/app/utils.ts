import { analyzePositions } from "@/workers/stockfish";
import { Position } from "./store";

export function extractSideToMove(fen: string) {
  return fen.split(" ")[1] === "w" ? "white" : "black";
}

export function analyzeCPL(position: Position, depth = 20) {
  return analyzePositions(
    [position.fen, ...position.moves.map((move) => move.to.fen)],
    depth,
  );
}
