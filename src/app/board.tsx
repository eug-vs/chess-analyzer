"use client";
import Chessground from "@react-chess/chessground";
import "./chessground.css";

interface Props {
  fen: string;
  size?: number;
  interactive?: boolean;
}

export default function Board({ fen, size, interactive = false }: Props) {
  return (
    <Chessground
      width={size}
      height={size}
      config={{
        fen,
        coordinates: false,
        viewOnly: !interactive,
      }}
    />
  );
}
