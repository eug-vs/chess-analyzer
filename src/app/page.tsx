"use client";
import { AnimatePresence } from "motion/react";
import { useSelector } from "@xstate/store/react";
import PositionLink from "./positionLink";
import { store } from "./store";
import PGNParser from "./pgnParser";
import _ from "lodash";
import { analyzeCPL, extractSideToMove } from "./utils";
import { useThrottle } from "@uidotdev/usehooks";
import { Button } from "@/components/ui/button";
import { SettingsIcon, SwordsIcon } from "lucide-react";
import { CardDescription, CardTitle } from "@/components/ui/card";
import PawnIcon from "./pawnIcon";
import LazilyAnimated from "@/components/ui/lazilyanimated";

export default function Home() {
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

  const throttledPositions = useThrottle(positions, 750);

  const movesOriginal = _.orderBy(
    positions
      .flatMap((pos) =>
        pos.moves.map((m) => ({
          ...m,
          from: pos,
          cpl: -((m.to.eval?.score || 0) + (pos.eval?.score || 0)),
        })),
      )
      .filter((m) => m.cpl < -50)
      .filter((m) => m.gameIds.length > 1)
      .filter((m) => m.from.eval?.bestmove !== m.lan),
    (move) => move.cpl,
  );

  const moves = useThrottle(movesOriginal, 750);

  return (
    <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
      <PGNParser />
      <Button onClick={() => Promise.allSettled(positions.map(analyzeCPL))}>
        <SettingsIcon />
        Analyze bad moves
      </Button>
      <h1 className="font-bold text-xl">
        Bad moves <span className="text-destructive">(??)</span>: {moves.length}
      </h1>
      <div className="grid 2xl:grid-cols-5 xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 gap-4 w-full">
        <AnimatePresence>
          {moves.map((move) => (
            <LazilyAnimated key={move.lan + move.from.fen} className="group">
              <PositionLink
                key={move.lan + move.from.fen}
                fen={move.to.fen}
                linkToFen={move.from.fen}
                lastMoveLan={move.lan}
                arrowLans={[move.from.eval?.bestmove].filter(
                  (x) => x !== undefined,
                )}
                orientation={extractSideToMove(move.from.fen)}
              >
                <CardTitle className="flex gap-1 items-center">
                  <PawnIcon />
                  {move.cpl} CPL
                </CardTitle>
                <CardDescription>{move.lan}</CardDescription>
                <CardDescription>Depth {move.from.eval?.depth}</CardDescription>
                <CardDescription>
                  Played in <b>{move.gameIds.length}</b> games
                </CardDescription>
              </PositionLink>
            </LazilyAnimated>
          ))}
        </AnimatePresence>
      </div>
      <h1 className="font-bold text-xl">
        Significant positions: {positions.length} / {graph.size}
      </h1>
      <div className="grid 2xl:grid-cols-5 xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 gap-4 w-full">
        <AnimatePresence>
          {throttledPositions.map((position) => (
            <LazilyAnimated key={position.fen}>
              <PositionLink
                key={position.fen}
                fen={position.fen}
                orientation={extractSideToMove(position.fen)}
              >
                <CardTitle className="flex gap-1 items-center">
                  <SwordsIcon />
                  {position.gameIds.length} games
                </CardTitle>
                <CardDescription>
                  {position.moves.length} distinct moves
                </CardDescription>
              </PositionLink>
            </LazilyAnimated>
          ))}
        </AnimatePresence>
      </div>
    </main>
  );
}
