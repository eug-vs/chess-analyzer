"use client";
import MoveLink from "@/app/moveLink";
import PositionLink, { decodeFen } from "@/app/positionLink";
import { fenToUniqueKey, store } from "@/app/store";
import { analyzeSwings, extractSideToMove } from "@/app/utils";
import { useSelector } from "@xstate/store/react";
import Link from "next/link";
import { use } from "react";

interface Props {
  params: Promise<{
    fen: string[];
  }>;
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
      {position && (
        <button
          className="bg-red-50 p-4"
          onClick={() => analyzeSwings(position)}
        >
          Analyze moves ({position?.eval})
        </button>
      )}
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
        {position?.moves.map((move) => <MoveLink key={move.lan} move={move} />)}
      </div>
    </>
  );
}
