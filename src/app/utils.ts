import { analyzePosition } from "@/orchestrator";
import { Position } from "./store";

export function extractSideToMove(fen: string) {
  return fen.split(" ")[1] === "w" ? "white" : "black";
}

export function analyzeSwings(position: Position) {
  return Promise.allSettled(
    [position.fen, ...position.moves.map((move) => move.to.fen)].map((fen) =>
      analyzePosition(fen),
    ),
  );
}
