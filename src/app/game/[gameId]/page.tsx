"use client";
import PositionLink from "@/app/positionLink";
import { store } from "@/app/store";
import { useSelector } from "@xstate/store/react";
import { use } from "react";

interface Props {
  params: Promise<{
    gameId: string;
  }>;
}

export default function GamePage({ params }: Props) {
  const { gameId } = use(params);
  const positions = useSelector(store, (state) => state.context.graph);
  const gamePositions = Array.from(
    positions.values().filter((v) => v.gameIds.includes(gameId)),
  );
  return (
    <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
      <h1 className="font-bold text-xl">Positions: {gamePositions.length}</h1>
      <div className="grid grid-cols-6 gap-4 w-full">
        {gamePositions.map((pos) => (
          <PositionLink key={pos.fen} fen={pos.fen} />
        ))}
      </div>
    </main>
  );
}
