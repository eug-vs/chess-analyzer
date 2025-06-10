import * as BrowserRunner from "@effect/platform-browser/BrowserWorkerRunner";
import * as Runner from "@effect/platform/WorkerRunner";
import { Effect, Layer, Logger, LogLevel, pipe, Stream } from "effect";
import { Chess } from "chess.js";
import { StoreEvent } from "@/app/store";
import { BrowserRuntime } from "@effect/platform-browser";

function getMovesFromPgn(pgn: string, player: string) {
  const chess = new Chess();
  chess.loadPgn(pgn);
  const headers = chess.getHeaders();
  const gameId = headers["GameId"];
  const [whitePlayer, blackPlayer] = [headers["White"], headers["Black"]];

  const whiteResult = (
    {
      "0": -1,
      "1": 1,
      "1/2": 0,
    } as const
  )[headers["Result"].split("-")[0]]!;

  const side = whitePlayer === player ? ("white" as const) : ("black" as const);

  return {
    moves: chess.history({ verbose: true }),
    game: {
      gameId,
      side,
      opponent: whitePlayer === player ? blackPlayer : whitePlayer,
      result:
        whitePlayer === player
          ? whiteResult
          : (-whiteResult as typeof whiteResult),
      date: new Date(headers["UTCDate"]),
    },
  };
}

const WorkerLive = Runner.layer<string, never, never, StoreEvent>(
  (pgn: string, player = "eug_vs") => {
    const { moves, game } = getMovesFromPgn(pgn, player);

    return Stream.concat(
      Stream.succeed({
        type: "addGame",
        game,
      }),
      Stream.fromIterable(
        moves
          .filter((move) => move.color === game.side[0])
          .map((move) => ({
            type: "addMove",
            fromFen: move.before,
            toFen: move.after,
            gameId: game.gameId,
            lan: move.lan,
            side: move.color === "w" ? "white" : "black",
          })),
      ),
    );
  },
).pipe(Layer.provide(BrowserRunner.layer));

BrowserRuntime.runMain(
  pipe(
    Runner.launch(WorkerLive),
    Logger.withMinimumLogLevel(LogLevel.Debug),
    Effect.withLogSpan("chessjs"),
  ),
);
