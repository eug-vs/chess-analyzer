"use client";
import { useSelector } from "@xstate/store/react";
import PositionLink from "./positionLink";
import { store } from "./store";
import PGNParser from "./pgnParser";
import _ from "lodash";
import { analyzeCPL, extractSideToMove } from "./utils";
import MoveLink from "./moveLink";
import { useAutoAnimate } from "@formkit/auto-animate/react";

export default function Home() {
  const [ref] = useAutoAnimate();
  const graph = useSelector(store, (state) => state.context.graph);
  const positions = _.orderBy(
    graph
      .values()
      .filter((p) => p.moves.length)
      .toArray(),
    [
      (pos) => pos.gameIds.length / pos.moves.length,
      (pos) =>
        _.sum(
          pos.moves.map(
            (move) => -(move.to.eval?.score || 0) + (pos.eval?.score || 0),
          ),
        ),
    ],
    ["desc", "desc"],
  ).filter((pos) => pos.gameIds.length / pos.moves.length > 1);

  const moves = _.orderBy(
    positions
      .flatMap((pos) =>
        pos.moves.map((m) => ({
          ...m,
          from: pos,
          cpl: -((m.to.eval?.score || 0) + (pos.eval?.score || 0)),
        })),
      )
      .filter((m) => m.cpl < 0),
    (move) => move.cpl,
  );

  return (
    <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
      <PGNParser />
      <button
        className="bg-red-50 p-4"
        onClick={() => Promise.allSettled(positions.map(analyzeCPL))}
      >
        Analyze swings
      </button>
      <h1 className="font-bold text-xl">Bad moves: {moves.length}</h1>
      <div ref={ref} className="grid grid-cols-5 gap-4 w-full">
        {moves.map((move) => (
          <PositionLink
            key={move.lan + move.from.fen}
            fen={move.to.fen}
            linkToFen={move.from.fen}
            lastMoveLan={move.lan}
            orientation={extractSideToMove(move.from.fen)}
          >
            <div>CPL: {move.cpl}</div>
            <div>Played in {move.gameIds.length} games</div>
          </PositionLink>
        ))}
      </div>
      <h1 className="font-bold text-xl">
        Positions: {positions.length} / {graph.size}
      </h1>
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
