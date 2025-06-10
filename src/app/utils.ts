export function extractSideToMove(fen: string) {
  return fen.split(" ")[1] === "w" ? "white" : "black";
}
