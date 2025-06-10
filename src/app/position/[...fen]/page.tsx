"use client";
import Board from "@/app/board";
import MoveLink from "@/app/moveLink";
import { decodeFen } from "@/app/positionLink";
import { usePosition } from "@/app/store";
import { analyzeCPL, extractSideToMove } from "@/app/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { ExternalLinkIcon, SettingsIcon } from "lucide-react";
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

  const position = usePosition(fen);
  const sideToMove = extractSideToMove(fen);

  return (
    <div className="grid xl:grid-cols-2 gap-4">
      <div className="h-min">
        <Board
          fen={fen}
          orientation={sideToMove}
          arrowLans={
            position?.eval?.bestmove ? [position.eval.bestmove] : undefined
          }
        />
      </div>
      <section className="space-y-4">
        <h2 className="text-muted-foreground">{fen}</h2>
        <section className="flex gap-4">
          {position && (
            <Button onClick={() => analyzeCPL(position)}>
              <SettingsIcon />
              Analyze tree
            </Button>
          )}
          <Link
            href={`https://lichess.org/analysis/${encodedFen}`}
            className={buttonVariants({ variant: "outline" })}
          >
            <ExternalLinkIcon />
            View on Lichess analysis
          </Link>
        </section>
        {position?.eval && (
          <section>
            <h2 className="text-lg font-bold">
              Evaluation (centipawns): {position.eval.score}
            </h2>
            <p className="text-muted-foreground">Depth {position.eval.depth}</p>
            <p className="text-muted-foreground">
              Best move {position.eval.bestmove}
            </p>
          </section>
        )}
        <h2 className="text-xl font-bold">Moves ({position?.moves.length})</h2>
        <section className="grid grid-cols-4 gap-4">
          {position?.moves.map((move) => (
            <MoveLink key={move.lan} move={move} />
          ))}
        </section>
        <h2 className="text-xl font-bold">
          Games ({position?.gameIds.length})
        </h2>
        <section className="grid grid-cols-4 gap-4">
          {position?.gameIds.map((game) => (
            <Link
              key={game}
              href={`/game/${game}`}
              className={buttonVariants({ variant: "link" })}
            >
              <ExternalLinkIcon /> {game}
            </Link>
          ))}
        </section>
      </section>
    </div>
  );
}
