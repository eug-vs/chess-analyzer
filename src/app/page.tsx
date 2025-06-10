"use client";
import { useSelector } from "@xstate/store/react";
import PositionLink from "./positionLink";
import { store } from "./store";
import PGNParser from "./pgnParser";
import _ from "lodash";
import { analyzeCPL, extractSideToMove } from "./utils";

export default function Home() {
  const graph = useSelector(store, (state) => state.context.graph);
  const positions = _.orderBy(
    graph
      .values()
      .filter((p) => p.moves.length)
      .toArray(),
    (pos) => pos.gameIds.length / pos.moves.length,
    "desc",
  ).filter((pos) => pos.gameIds.length / pos.moves.length > 1);

  return (
    <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
      <h1 className="font-bold text-xl">
        Positions: {positions.length} / {graph.size}
      </h1>
      <PGNParser />
      <button
        className="bg-red-50 p-4"
        onClick={() => Promise.allSettled(positions.map(analyzeCPL))}
      >
        Analyze swings
      </button>
      <div className="grid grid-cols-5 gap-4 w-full">
        {positions.map((position) => (
          <PositionLink
            key={position.fen}
            fen={position.fen}
            orientation={extractSideToMove(position.fen)}
          >
            {position.gameIds.length} games, {position.moves.length} moves
          </PositionLink>
        ))}
      </div>
    </main>
  );
}
