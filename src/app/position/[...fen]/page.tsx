"use client";
import PositionLink, { decodeFen } from "@/app/positionLink";
import { fenToUniqueKey, store } from "@/app/store";
import { extractSideToMove } from "@/app/utils";
import { Key } from "@lichess-org/chessground/types";
import { useSelector } from "@xstate/store/react";
import Link from "next/link";
import { use } from "react";

interface Props {
  params: Promise<{
    fen: string[];
  }>;
}

function lanToKeys(lan: string): [Key, Key] {
  return [lan.slice(0, 2) as Key, lan.slice(2, 4) as Key];
}
export default function PositionPage({ params }: Props) {
  const { fen: fenParts } = use(params);
  const encodedFen = fenParts.join("/");
  const fen = decodeFen(encodedFen);

  const position = useSelector(store, (state) =>
    state.context.graph.get(fenToUniqueKey(fen)),
  );
  const sideToMove = extractSideToMove(fen);
  console.log({ position });

  return (
    <>
      <h1 className="text-xl font-bold">FEN: {fen}</h1>
      <div className="max-w-128">
        <PositionLink fen={fen} orientation={sideToMove} />
      </div>
      <Link href={`https://lichess.org/analysis/${encodedFen}`}>
        Lichess link
      </Link>
      <h2 className="text-xl font-bold">Games ({position?.gameIds.length})</h2>
      <div className="grid">
        {position?.gameIds.map((game) => (
          <Link key={game} href={`/game/${game}`}>
            Game: {game}
          </Link>
        ))}
      </div>
      <h2 className="text-xl font-bold">Moves ({position?.moves.length})</h2>
      <div className="grid grid-cols-4 gap-4">
        {position?.moves.map((move) => (
          <PositionLink
            key={move.lan}
            fen={move.to.fen}
            orientation={sideToMove}
            lastMove={lanToKeys(move.lan)}
          >
            <div className="font-bold text-lg">
              {move.lan} ({move.gameIds.length} games)
            </div>
          </PositionLink>
        ))}
      </div>
    </>
  );
}
