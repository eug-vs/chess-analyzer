import Link from "next/link";
import Board from "./board";

interface Props {
  fen: string;
}

export function encodeFen(fen: string) {
  return fen.replaceAll(" ", "_");
}
export function decodeFen(fen: string) {
  return fen.replaceAll("_", " ");
}

export default function PositionLink({ fen }: Props) {
  return (
    <Link
      href={`/position/${encodeFen(fen)}`}
      className="p-2 flex justify-center items-center rounded-lg border"
    >
      <Board fen={fen} size={256} />
    </Link>
  );
}
