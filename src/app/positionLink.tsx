import Link from "next/link";
import Board from "./board";

interface Props extends React.ComponentProps<typeof Board> {
  children?: React.ReactNode;
}

export function encodeFen(fen: string) {
  return fen.replaceAll(" ", "_");
}
export function decodeFen(fen: string) {
  return fen.replaceAll("_", " ");
}

export default function PositionLink({ children, ...props }: Props) {
  return (
    <Link
      href={`/position/${encodeFen(props.fen)}`}
      className="p-2 flex justify-center flex-col rounded-lg border transition hover:-translate-y-0.5 hover:shadow-xl "
    >
      <Board {...props} />
      {children}
    </Link>
  );
}
